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
        .history-panel {
            transform: translateX(-100%);
            transition: transform 0.3s ease-in-out;
        }
        .history-panel.open {
            transform: translateX(0);
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

    <!-- History Toggle Button -->
    <button 
        id="historyBtn" 
        class="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 bg-[#0066AD] text-white rounded-lg hover:bg-[#0077CC] transition-colors"
        title="Show History"
    >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
        </svg>
        <span class="text-sm font-medium">History</span>
        <span id="historyCount" class="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none bg-[#004d80] rounded-full ml-1">0</span>
    </button>

    <!-- History Panel -->
    <div id="historyPanel" class="history-panel fixed left-0 top-0 h-full w-80 bg-[#252526] border-r border-[#404040] z-50">
        <div class="p-4 border-b border-[#404040] flex justify-between items-center bg-[#2d2d2d]">
            <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[#0066AD]" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                </svg>
                <h2 class="text-[#cccccc] text-lg font-semibold">Chat History</h2>
            </div>
            <button id="closeHistoryBtn" class="text-[#858585] hover:text-[#cccccc] transition-colors p-2 hover:bg-[#404040] rounded">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        <!-- Add search input -->
        <div class="p-4 border-b border-[#404040] bg-[#2d2d2d]">
            <div class="relative">
                <input 
                    type="text" 
                    id="historySearch" 
                    class="w-full px-4 py-2 bg-[#3c3c3c] text-[#cccccc] rounded-lg border border-[#404040] 
                           focus:outline-none focus:border-[#0e639c] focus:ring-1 focus:ring-[#0e639c] 
                           placeholder-[#858585]"
                    placeholder="Search history..."
                />
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute right-3 top-2.5 text-[#858585]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
        </div>
        <div id="historyList" class="overflow-y-auto h-[calc(100%-124px)] p-4 space-y-3">
            <!-- History items will be populated here -->
        </div>
    </div>

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

    <button 
        id="refreshBtn" 
        class="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 bg-[#0066AD] text-white rounded-lg hover:bg-[#0077CC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#0066AD]"
        title="New Chat"
    >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        <span class="text-sm font-medium">New Chat</span>
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
                class="h-fit px-4 py-2 bg-[#0066AD] text-[#cccccc] rounded hover:bg-[#004d80] focus:outline-none focus:ring-2 focus:ring-[#4d4d4d] border border-[#454545] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#0066AD]"
            >
                <span id="sendIcon" class="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                    Send
                </span>
                <span id="stopIcon" class="hidden flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clip-rule="evenodd" />
                    </svg>
                    Stop
                </span>
            </button>
        </div>
    </div>

    <script nonce="${nonce}" type="text/javascript" src="${scriptUri}"></script>

</body>
</html>

`;
}
