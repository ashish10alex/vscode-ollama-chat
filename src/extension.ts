import * as vscode from 'vscode';
import os from 'os';
import ollama from 'ollama';
import { executableIsAvailable, getAvaialableModels, getDefaultModel, systemPromptContent } from './utils';
import { getWebViewHtmlContent } from './chat';
import { Ollama } from 'ollama';

// Add interface for history item
interface ChatHistoryItem {
    question: string;
    answer: string;
    timestamp: string;
}

async function preloadModel(model: string) {
    const preloadMessages = [
        { role: 'system', content: '' },
        { role: 'user', content: '' }
    ];
    try {
        const config = vscode.workspace.getConfiguration('ollama-chat');
        const serverUrl = config.get<string>('serverUrl') || 'http://localhost:11434';
        
        const ollamaInstance = new Ollama({
            host: serverUrl
        });

        await ollamaInstance.chat({
            model: model,
            messages: preloadMessages,
            stream: false,
        });
        vscode.window.showInformationMessage(`Preloaded model: ${model}`);
    } catch (error) {
        vscode.window.showErrorMessage(`Error preloading model: ${error}`);
    }
}

export function activate(context: vscode.ExtensionContext) {

	const ollamaBinaryName = "ollama";
    globalThis.isRunningOnWindows = os.platform() === 'win32' ? true : false;
    globalThis.selectedModel = undefined;
	globalThis.stopResponse = false;

	executableIsAvailable(ollamaBinaryName);

    const config = vscode.workspace.getConfiguration('ollama-chat');
    const serverUrl = config.get<string>('serverUrl') || 'http://localhost:11434';
    
    const ollamaInstance = new Ollama({
        host: serverUrl
    });

    const disposable = vscode.commands.registerCommand('ollama-chat.ollamaChat', () => {

		//TODO: all these could be done in parallel
		const ollamaInstalled = executableIsAvailable(ollamaBinaryName);
		const availableModels = getAvaialableModels();


		const panel = vscode.window.createWebviewPanel(
				"Ollama chat",
				"Ollama chat window",
				vscode.ViewColumn.One,
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

		if(ollamaInstalled === false){
			panel.webview.postMessage({command: "ollamaInstallErorr", text: "ollama not installed"});
		};

		selectedModel = getDefaultModel(availableModels);

        // Preload the model right after launching the panel
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

		if (selectedModel && !availableModels.includes(selectedModel)) {
			panel.webview.postMessage({
				command: "ollamaModelsNotDownloaded",
				text: `The configured model '${selectedModel}' is not available. Please download it first or choose a different model.`
			});
			selectedModel = availableModels.length > 0 ? availableModels[0] : undefined;
		}

		panel.webview.postMessage({availableModels: availableModels, selectedModel: selectedModel});

		// Load chat history when panel is created
		const chatHistory = context.globalState.get<ChatHistoryItem[]>('ollamaChatHistory', []);
		
		// Send initial history to webview
		panel.webview.postMessage({
			command: 'loadHistory',
			history: chatHistory
		});

		panel.webview.onDidReceiveMessage(async(message: any) => {
			let responseText = "";
			
			if(message.command === 'chat' || message.command === 'stopResponse'){

				if(message.command === 'chat'){
					globalThis.stopResponse = false;
				} else if(message.command === 'stopResponse'){
					globalThis.stopResponse = true;
				}
				
				const historyItem: ChatHistoryItem = {
					question: message.question,
					answer: '',
					timestamp: new Date().toLocaleTimeString()
				};
				
				const currentHistory = context.globalState.get<ChatHistoryItem[]>('ollamaChatHistory', []);
				const updatedHistory = [historyItem, ...currentHistory].slice(0, 50);
				
				const systemPromt = { role: 'system', content: systemPromptContent};
				const userPromt = { role: 'user', content: message.question};
				
				try {
					const response = await ollamaInstance.chat({
						model: selectedModel || "",
						messages: [systemPromt, userPromt],
						stream: true,
					});

					// Collect full response
					for await (const part of response) {
						if(globalThis.stopResponse){
							panel.webview.postMessage({messageStreamEnded: true});
							return;
						}
						responseText += part.message.content;
						panel.webview.postMessage({command: "chatResponse", text: responseText, availableModels: availableModels, selectedModel: selectedModel});
					}

					// Update history item with the complete answer
					historyItem.answer = responseText;
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
						panel.webview.postMessage({command: "error", text: "An error occurred while processing your request"});
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
			}
		});

		});

    context.subscriptions.push(disposable);
}

export function deactivate() { }
