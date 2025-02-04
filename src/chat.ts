import {  ExtensionContext, Uri, Webview} from "vscode";
import { getNonce } from "./utils";

export function getWebViewHtmlContent(context:ExtensionContext, webview: Webview ) {


const scriptUri = webview.asWebviewUri(Uri.joinPath(context.extensionUri, "media", "js", "panel.js"));
const nonce = getNonce();

return /*html*/ `
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
            <p class="text-[#858585] text-sm mb-3">Ask your deepest desires with</p>
            <div class="relative w-56 mx-auto transform hover:scale-[1.02] transition-transform duration-200">
                <select 
                    id="modelSelector"
                    class="w-full px-4 py-2 bg-[#3c3c3c]/90 text-[#cccccc] rounded-xl border-2 border-[#4d4d4d]/50 
                        focus:outline-none focus:ring-2 focus:ring-[#0e639c]/80 focus:border-[#0e639c]/80
                        backdrop-blur-sm shadow-lg appearance-none transition-all duration-200
                        hover:border-[#5e5e5e]"
                >
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    <svg class="h-5 w-5 text-[#858585]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
        </div>
        </div>
    </div>

    <button id="refreshBtn" class="absolute top-4 right-4 p-2 bg-[#0066AD] text-white rounded-full hover:bg-[#0077CC] transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
        </svg>
    </button>

      <!-- Error message for Ollama CLI not installed -->
    <div id="ollamaError" class="hidden bg-red-500 text-white p-4 rounded-md mb-4">
      <p class="font-bold">Error: Ollama CLI not installed</p>
      <p>Please install Ollama CLI to use this application. Visit <a href="https://ollama.com/download" class="underline" target="_blank" rel="noopener noreferrer">ollama.com</a> for installation instructions.</p>
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
                rows="1"
            ></textarea>
            <button
                id="submitBtn"
                class="h-fit px-4 py-2 bg-[#0066AD] text-[#cccccc] rounded hover:bg-[#004d80] focus:outline-none focus:ring-2 focus:ring-[#4d4d4d] border border-[#454545]"
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
