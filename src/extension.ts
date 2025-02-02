import * as vscode from 'vscode';
import os from 'os';
import ollama from 'ollama';
import { executableIsAvailable, getAvaialableModels } from './utils';
import { getWebViewHtmlContent } from './chat';

export function activate(context: vscode.ExtensionContext) {

	const ollamaBinaryName = "ollama";
    globalThis.isRunningOnWindows = os.platform() === 'win32' ? true : false;

	let defaultModel:string|undefined = vscode.workspace.getConfiguration('ollama-chat').get('defaultModel');
	if(!defaultModel){
		defaultModel = 'qwen2.5-coder';
	}
	globalThis.defaultModel = defaultModel;

	executableIsAvailable(ollamaBinaryName);

    const disposable = vscode.commands.registerCommand('ollama-chat.ollamaChat', () => {
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

		panel.webview.postMessage({availableModels: availableModels});

		panel.webview.onDidReceiveMessage(async(message: any) => {
			let responseText = "";
			if(message.command === 'chat'){
				const promt = { role: 'user', content: message.question};
				const response = await ollama.chat(
					{
						model: defaultModel,
						messages: [promt],
						stream: true,
					}
				);
				for await (const part of response) {
					responseText += part.message.content;
					panel.webview.postMessage({command: "chatResponse", text: responseText, availableModels: availableModels});
				}
			}
		});

		});

    context.subscriptions.push(disposable);
}

export function deactivate() { }
