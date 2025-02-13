import * as vscode from 'vscode';
import os from 'os';
import ollama from 'ollama';
import { codingAssistantPromptContent, executableIsAvailable, getAvaialableModels, getDefaultModel, systemPromptContent } from './utils';
import { getWebViewHtmlContent } from './chat';
import MarkdownIt from 'markdown-it';
import path from 'path';

// Add interface for history item
interface ChatHistoryItem {
    question: string;
    answer: string;
    timestamp: string;
}

// Add this interface near other interfaces
interface CodeContext {
    selectedText: string;
    fullFileContent: string;
    filePath: string;
    language: string;
    startLine: number;
    endLine: number;
}

async function preloadModel(model: string) {
    try {
        await ollama.generate({		
            model: model,
            prompt: '',
        });
    } catch (error) {
        vscode.window.showErrorMessage(`Error preloading model: ${error}`);
    }
}

// Add this function before the activate function
async function showInputBox(codeContext: CodeContext): Promise<string | undefined> {
    const filename = path.basename(codeContext.filePath);
    const lineRange = `lines ${codeContext.startLine}-${codeContext.endLine}`;
    return vscode.window.showInputBox({
        prompt: `Ask about the selected code in ${filename} (${lineRange})`,
        placeHolder: "E.g.: How can I improve this code?",
    });
}

export function activate(context: vscode.ExtensionContext) {

	const ollamaBinaryName = "ollama";
    globalThis.isRunningOnWindows = os.platform() === 'win32' ? true : false;
    globalThis.selectedModel = undefined;
	globalThis.stopResponse = false;

	executableIsAvailable(ollamaBinaryName);

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
					const response = await ollama.chat({
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

    const askAboutSelection = vscode.commands.registerCommand('ollama-chat.askAboutSelection', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);
        const fullFileContent = editor.document.getText();
        
        if (!selectedText) {
            vscode.window.showErrorMessage('No text selected');
            return;
        }

        const codeContext: CodeContext = {
            selectedText,
            fullFileContent,
            filePath: editor.document.fileName,
            language: editor.document.languageId,
            startLine: selection.start.line + 1,
            endLine: selection.end.line + 1
        };

        const userQuery = await showInputBox(codeContext);
        if (!userQuery) {return;}

        const contextPrompt = `I have the following ${codeContext.language} file, where lines ${codeContext.startLine}-${codeContext.endLine} are specifically selected:

Full file content:
\`\`\`${codeContext.language}
${codeContext.fullFileContent}
\`\`\`

The selected portion (lines ${codeContext.startLine}-${codeContext.endLine}):
\`\`\`${codeContext.language}
${codeContext.selectedText}
\`\`\`

${userQuery}`;

        try {
            const systemPromt = { role: 'system', content: codingAssistantPromptContent };
            const userPromt = { role: 'user', content: contextPrompt };
            selectedModel = getDefaultModel(getAvaialableModels());

            // Show progress indicator
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Getting response from ${selectedModel}...`,
                cancellable: true
            }, async (progress, token) => {
                let responseText = "";
                
                const response = await ollama.chat({
                    model: selectedModel || "",
                    messages: [systemPromt, userPromt],
                    stream: true,
                });

                const panel = vscode.window.createWebviewPanel(
                    'ollamaResponse',
                    'Ollama Response',
                    vscode.ViewColumn.Beside,
                    {
                        enableScripts: true
                    }
                );

                const md = new MarkdownIt({
                    html: true,
                    highlight: function (str, lang) {
                        return `<pre class="hljs"><code>${str}</code></pre>`;
                    }
                });

                for await (const part of response) {
                    if (token.isCancellationRequested) {
                        break;
                    }
                    responseText += part.message.content;
                    panel.webview.html = `
                        <!DOCTYPE html>
                        <html>
                        <head>
							<link rel="stylesheet" href="https://unpkg.com/highlightjs-copy/dist/highlightjs-copy.min.css" />
							<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
							<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
							<script src="https://unpkg.com/highlightjs-copy/dist/highlightjs-copy.min.js"></script>
                            <script>
								hljs.highlightAll();
								hljs.configure({ignoreUnescapedHTML: true});
								hljs.addPlugin(new CopyButtonPlugin({ autohide: false }));
							</script>
                            <style>
                                body { padding: 16px; }
                                code { font-family: 'Consolas', 'Courier New', monospace; }
                            </style>
                        </head>
                        <body>
                            ${md.render(responseText)}
                        </body>
                        </html>
                    `;
                }
            });
        } catch (error: any) {
            vscode.window.showErrorMessage(`Error: ${error.message}`);
        }
    });

    context.subscriptions.push(disposable);
    context.subscriptions.push(askAboutSelection);
}

export function deactivate() { }
