import {  ExtensionContext, Uri, Webview} from "vscode";
import { getNonce } from "./utils";


export function getWebViewHtmlContent(context: ExtensionContext, webview: Webview) {
    const scriptUri = webview.asWebviewUri(Uri.joinPath(context.extensionUri, 'dist', 'webview.js'));
    const nonce = getNonce();
  
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src ${webview.cspSource} 'nonce-${nonce}' 'unsafe-eval'; style-src ${webview.cspSource} 'unsafe-inline'; img-src ${webview.cspSource} https:;">
        <title>My Extension</title>
      </head>
      <body>
        <div id="root"></div>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>
    `;
  }
