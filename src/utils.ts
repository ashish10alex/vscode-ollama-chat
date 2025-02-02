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
            border-top-color: rgb(37 99 235);
            animation: spin 1s linear infinite;
        }
    </style>
    <link rel="stylesheet" href="https://unpkg.com/highlightjs-copy/dist/highlightjs-copy.min.css" />
</head>
<body class="bg-[#1e1e1e] text-[#d4d4d4] font-sans h-screen flex flex-col">

    <script src="https://cdn.jsdelivr.net/npm/markdown-it@14.1.0/dist/markdown-it.min.js"></script>

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/go.min.js"></script>
    <script src="https://unpkg.com/highlightjs-copy/dist/highlightjs-copy.min.js"></script>

    <div class="flex-1 overflow-y-auto p-4 space-y-4" id="chatContainer">
        <!-- Header -->
        <div class="text-center mb-8">
            <p class="text-[#858585] text-sm">Ask your deepest desires</p>
        </div>
    </div>

    <!-- Input Area -->
    <div class="border-t border-[#252526] p-4 bg-[#1e1e1e]">
        <div class="flex gap-2">
            <textarea 
                id="questionInput"
                class="w-full p-2 bg-[#3c3c3c] text-[#cccccc] rounded border border-[#3c3c3c] 
                    focus:outline-none focus:border-[#0e639c] focus:ring-2 focus:ring-[#0e639c] 
                    focus:ring-offset-2 focus:ring-offset-[#1e1e1e] placeholder-[#858585]
                    transition-all duration-100"
                placeholder="Type your question here..."
                autofocus
                rows="2"
            ></textarea>
            <button 
                id="submitBtn"
                class="h-fit px-4 py-2 bg-[#333333] text-[#cccccc] rounded hover:bg-[#404040] focus:outline-none focus:ring-2 focus:ring-[#4d4d4d] border border-[#454545]"
            >
                Send
            </button>
        </div>
    </div>

    <script nonce="${nonce}" type="text/javascript" src="${scriptUri}"></script>

</body>
</html>

`;
}
