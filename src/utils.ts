import {  ExtensionContext, Uri, Webview} from "vscode";

export function getNonce() {
    let text = "";
    const possible =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

export function getWebViewHtmlContent(context:ExtensionContext, webview: Webview ) {

const scriptUri = webview.asWebviewUri(Uri.joinPath(context.extensionUri, "src", "panel.js"));
const nonce = getNonce();

/*html*/
return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .loader {
            border-top-color: #3B82F6;
            animation: spin 1s linear infinite;
        }
        .whitespace-pre-wrap {
            white-space: pre-wrap;
            word-wrap: break-word;
        }
    </style>

    <link href=" https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism.min.css " rel="stylesheet">
    <link rel="stylesheet" href="https://unpkg.com/highlightjs-copy/dist/highlightjs-copy.min.css" />

</head>
<body class="bg-white dark:bg-gray-900 h-screen flex flex-col">

    <script src="https://cdn.jsdelivr.net/npm/markdown-it@14.1.0/dist/markdown-it.min.js"></script>

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
    <!-- and it's easy to individually load additional languages -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/go.min.js"></script>

    <script src="https://unpkg.com/highlightjs-copy/dist/highlightjs-copy.min.js"></script>

    <div class="flex-1 overflow-y-auto p-4 space-y-4" id="chatContainer">
        <!-- Header -->
        <div class="text-center mb-8">
            <p class="text-gray-600 dark:text-gray-300">Ask your deepest desires</p>
        </div>

        <!-- Messages will be appended here -->
    </div>

    <!-- Input Area -->
    <div class="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
        <div class="flex space-x-2">
            <textarea 
                type="text" 
                id="questionInput"
                class="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                placeholder="Type your question here..."
                autofocus
            ></textarea>
            <button 
                id="submitBtn"
                class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                Send
            </button>
        </div>
    </div>

    <script nonce="${nonce}" type="text/javascript"  src="${scriptUri}"></script>

</body>
</html>
`;
}
