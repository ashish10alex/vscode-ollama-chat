import * as vscode from 'vscode';
import ollama from 'ollama';
import { getWebViewHtmlContent } from './utils';


export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand('ollama-chat.ollamaChat', () => {
		const panel = vscode.window.createWebviewPanel(
				"Ollama chat",
				"Ollama chat window",
				vscode.ViewColumn.One,
				{
					enableScripts: true,
					retainContextWhenHidden: true
				}
		);
		panel.webview.html = getWebViewHtmlContent(context, panel.webview);

		panel.webview.onDidReceiveMessage(async(message: any) => {
			let responseText = "";
			if(message.command === 'chat'){
				const promt = { role: 'user', content: message.question};
				const response = await ollama.chat(
					{
						model: 'qwen2.5-coder',
						// model: 'deepseek-r1:8b',
						messages: [promt],
						stream: true,
					}
				);
				for await (const part of response) {
					responseText += part.message.content;
					// console.log(part.message.content);
					panel.webview.postMessage({command: "chatResponse", text: responseText});
				}
			}
		});

		});

    context.subscriptions.push(disposable);
}

export function deactivate() { }
