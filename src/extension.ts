import * as vscode from 'vscode';
import os from 'os';
import { executableIsAvailable, getDefaultModel, systemPromptContent } from './utils';
import { getWebViewHtmlContent } from './chat';
import { ModelResponse, Ollama } from 'ollama';

// Add interface for message
interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

// Update ChatHistoryItem to include messages
interface ChatHistoryItem {
    question: string;
    answer: string;
    timestamp: string;
    messages?: ChatMessage[]; // Add this to store conversation context
}

async function preloadModel(model: string) {
    try {
        const config = vscode.workspace.getConfiguration('ollama-chat');
        const serverUrl = config.get<string>('serverUrl') || 'http://localhost:11434';

        const ollamaInstance = new Ollama({
            host: serverUrl
        });

        await ollamaInstance.generate({
            model: model,
            prompt: "",
            stream: false,
        });
    } catch (error) {
        vscode.window.showErrorMessage(`Error preloading model: ${error}`);
    }
}

async function getAvaialableModels(ollamaInstance:Ollama): Promise<ModelResponse[]>{
    const availableModels = await ollamaInstance.list();
    return availableModels.models;
}

function createChatPanel(context: vscode.ExtensionContext, initialQuestion?: string, viewColumn: vscode.ViewColumn = vscode.ViewColumn.Beside) {
    const config = vscode.workspace.getConfiguration('ollama-chat');
    const serverUrl = config.get<string>('serverUrl') || 'http://localhost:11434';

    const ollamaInstance = new Ollama({
        host: serverUrl
    });

    let currentConversation: ChatMessage[] = [];

    const panel = vscode.window.createWebviewPanel(
        "Ollama chat",
        "Ollama chat window",
        viewColumn,
        {
            enableFindWidget: true,
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [
                vscode.Uri.joinPath(context.extensionUri, "media", "js")
            ],
        },
    );
    panel.webview.html = getWebViewHtmlContent(context, panel.webview);

    let ollamaInstalled = true;
    if (serverUrl === 'http://localhost:11434') {
        ollamaInstalled = executableIsAvailable("ollama");
        if (ollamaInstalled === false) {
            panel.webview.postMessage({ command: "ollamaInstallErorr", text: "ollama not installed" });
        }
    }

    getAvaialableModels(ollamaInstance).then(availableModelsMeta => {
        const availableModels = availableModelsMeta.map((model) => model.name);
        selectedModel = getDefaultModel(availableModels);

        if (ollamaInstalled && globalThis.selectedModel) {
            preloadModel(globalThis.selectedModel);
        }

        if (!selectedModel) {
            panel.webview.postMessage({
                command: "ollamaModelsNotDownloaded",
                text: "No models available. Please download a model first."
            });
            return;
        }

        panel.webview.postMessage({ availableModels: availableModels, selectedModel: selectedModel });

        const chatHistory = context.globalState.get<ChatHistoryItem[]>('ollamaChatHistory', []);
        panel.webview.postMessage({
            command: 'loadHistory',
            history: chatHistory
        });

        if (initialQuestion) {
            panel.webview.postMessage({
                command: 'initialQuestion',
                question: initialQuestion
            });
        }
    });

    panel.webview.onDidReceiveMessage(async (message: any) => {
        let responseText = "";

        if (message.command === 'chat' || message.command === 'stopResponse') {
            if(message.command === 'chat'){
                globalThis.stopResponse = false;
            } else if(message.command === 'stopResponse'){
                globalThis.stopResponse = true;
            }

            const historyItem: ChatHistoryItem = {
                question: message.question,
                answer: '',
                timestamp: new Date().toLocaleTimeString(),
                messages: [...currentConversation]
            };

            const currentHistory = context.globalState.get<ChatHistoryItem[]>('ollamaChatHistory', []);
            const updatedHistory = [historyItem, ...currentHistory].slice(0, 50);

            // Add system prompt only if conversation is empty
            if (currentConversation.length === 0) {
                currentConversation.push({ 
                    role: 'system', 
                    content: systemPromptContent 
                });
            }

            currentConversation.push({
                role: 'user',
                content: message.question
            });

            try {
                const response = await ollamaInstance.chat({
                    model: selectedModel || "",
                    messages: currentConversation,
                    stream: true,
                });

                // Collect full response
                for await (const part of response) {
                    if(globalThis.stopResponse){
                        panel.webview.postMessage({messageStreamEnded: true});
                        return;
                    }
                    responseText += part.message.content;
                    panel.webview.postMessage({
                        command: "chatResponse", 
                        text: responseText,
                        selectedModel: selectedModel
                    });
                }

                // Add assistant response to conversation
                currentConversation.push({
                    role: 'assistant',
                    content: responseText
                });

                // Update history item with the complete answer
                historyItem.answer = responseText;
                historyItem.messages = [...currentConversation];
                await context.globalState.update('ollamaChatHistory', updatedHistory);

                panel.webview.postMessage({
                    command: "updateHistoryAnswer",
                    question: message.question,
                    answer: responseText,
                    timestamp: historyItem.timestamp
                });

                panel.webview.postMessage({messageStreamEnded: true});
            } catch (error: any) {
                if (error.name === 'AbortError') {
                    panel.webview.postMessage({messageStreamEnded: true});
                } else {
                    panel.webview.postMessage({
                        command: "error", 
                        text: "An error occurred while processing your request"
                    });
                }
            }
        } else if (message.command === "deleteHistoryItem") {
            // Handle deleting individual history item
            const currentHistory = context.globalState.get<ChatHistoryItem[]>('ollamaChatHistory', []);
            const updatedHistory = currentHistory.filter(item =>
                !(item.question === message.question && item.timestamp === message.timestamp)
            );
            await context.globalState.update('ollamaChatHistory', updatedHistory);
        } else if (message.command === "selectedModel") {
            selectedModel = message.selectedModel;
        } else if (message.command === "newChat") {
            currentConversation = [];
        }
    });

    return panel;
}

export function activate(context: vscode.ExtensionContext) {
    globalThis.isRunningOnWindows = os.platform() === 'win32' ? true : false;
    globalThis.selectedModel = undefined;
    globalThis.stopResponse = false;

    const config = vscode.workspace.getConfiguration('ollama-chat');
    const serverUrl = config.get<string>('serverUrl') || 'http://localhost:11434';

    if (serverUrl === 'http://localhost:11434') {
        executableIsAvailable("ollama");
    }

    // Register the original chat command
    const chatCommand = vscode.commands.registerCommand('ollama-chat.ollamaChat', async () => {
        createChatPanel(context, undefined, vscode.ViewColumn.One);
    });

    // Register the new command for selected text
    const askSelectedCommand = vscode.commands.registerCommand('ollama-chat.askSelected', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active text editor found');
            return;
        }

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        if (!selectedText) {
            vscode.window.showWarningMessage('No text selected');
            return;
        }

        const question = `Selected text:\n\`\`\`\n${selectedText}\n\`\`\`\n\n`;
        createChatPanel(context, question, vscode.ViewColumn.Beside);
    });

    context.subscriptions.push(chatCommand, askSelectedCommand);
}

export function deactivate() { }
