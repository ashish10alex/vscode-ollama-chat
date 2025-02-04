import * as vscode from 'vscode';
import os from 'os';
import ollama from 'ollama';
import { executableIsAvailable, getAvaialableModels } from './utils';
import { getWebViewHtmlContent } from './chat';

export function activate(context: vscode.ExtensionContext) {

	const ollamaBinaryName = "ollama";
    globalThis.isRunningOnWindows = os.platform() === 'win32' ? true : false;
    globalThis.selectedModel = undefined;


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

		if(!selectedModel){
			if(availableModels.length >= 1){
				selectedModel = availableModels[0];
			} else {
				panel.webview.postMessage({command: "ollamaModelsNotDownloaded", text: "Models not downloded"});
				return;
			}
		}

		panel.webview.postMessage({availableModels: availableModels, selectedModel: selectedModel});

		panel.webview.onDidReceiveMessage(async(message: any) => {
			let responseText = "";
			if(message.command === 'chat'){
				const systemPromt = { role: 'system', content: 'give me links in markdown format [text_of_link](address_to_resource) for any resource that you wnat to point me to from where you inferred the answer'};
				const userPromt = { role: 'user', content: message.question};
				const response = await ollama.chat(
					{
						model: selectedModel || "", //FIXME: we need to show an error instead. not have "" as deafult results in type error
						messages: [systemPromt, userPromt],
						stream: true,
					}
				);
				for await (const part of response) {
					responseText += part.message.content;
					panel.webview.postMessage({command: "chatResponse", text: responseText, availableModels: availableModels, selectedModel: selectedModel});
				}
			} else if (message.command === "selectedModel"){
				selectedModel = message.selectedModel;
			}
		});

		});

    context.subscriptions.push(disposable);
}

export function deactivate() { }
