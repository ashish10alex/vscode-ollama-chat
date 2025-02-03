const vscode = acquireVsCodeApi();
const chatContainer = document.getElementById('chatContainer');
const questionInput = document.getElementById('questionInput');
const submitBtn = document.getElementById('submitBtn');
const modelSelector = document.getElementById('modelSelector');

let currentAssistantMessage = null;

window.onload = function() {
    questionInput.focus();
};

document.addEventListener('DOMContentLoaded', () => {
    hljs.configure({ignoreUnescapedHTML: true});
    hljs.addPlugin(new CopyButtonPlugin({ autohide: false }));
});

const md = markdownit({
    highlight: (str, lang) => {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return `<pre class="bg-[#252526] rounded p-4 my-2 border border-[#404040] overflow-x-auto"><code class="hljs language-${lang}">${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`;
            } catch (__) {}
        }
        return `<pre class="bg-[#252526] rounded p-4 my-2 border border-[#404040]"><code>${md.utils.escapeHtml(str)}</code></pre>`;
    }
});

function populateModelSelector(availableModels, selectedModel) {
    modelSelector.innerHTML = ''; // clear existing models
    availableModels.forEach((model) => {
        const option = new Option(model, model);
        option.className = 'bg-[#2d2d2d]';
        modelSelector.add(option);
    });
    document.getElementById('modelSelector').value = selectedModel;
}

// Create a new message. If it's an assistant message, store it as the currentAssistantMessage.
function addMessage(content, isUser = true) {
    const loadingIndicator = chatContainer.querySelector('.loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`;
    messageDiv.innerHTML = `<div class="max-w-7xl w-full p-4 rounded-lg ${
        isUser
            ? 'bg-[#0066AD] text-[#ffffff] mx-auto'
            : 'bg-[#252526] text-[#d4d4d4] border border-[#404040] mx-auto'
    } shadow-lg transition-all duration-200 hover:shadow-xl"><div class="prose max-w-none"><div class="whitespace-pre-wrap [&_a]:text-[#3794ff] [&_a:hover]:text-[#4aa0ff] [&_code]:bg-[#373737]">${isUser ? content : md.render(content)}</div></div></div>`;

    chatContainer.appendChild(messageDiv);

    // When adding an assistant message, update the current block reference.
    if (!isUser) {
        currentAssistantMessage = messageDiv;
    }

    return messageDiv;
}

function startNewAssistantAnswer(initialContent = '') {
    const messageDiv = addMessage(initialContent, false);
    messageDiv.style.display = "none";
    currentAssistantMessage = messageDiv;
}

function updateLastAssistantMessage(content) {
    const loadingIndicator = chatContainer.querySelector('.loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }

    if (currentAssistantMessage) {
        if (currentAssistantMessage.style.display === "none") {
            currentAssistantMessage.style.display = "block";
        }
        const contentDiv = currentAssistantMessage.querySelector('.whitespace-pre-wrap');
        if (contentDiv) {
            contentDiv.innerHTML = md.render(content);
            hljs.highlightAll();
        }
    } else {
        // In case no block exists, create one.
        currentAssistantMessage = addMessage(content, false);
    }
}

function showLoading() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'flex justify-center loading-indicator mb-6';
    loadingDiv.innerHTML = `
        <div class="max-w-3xl p-4 rounded-lg bg-[#252526] border border-[#404040] w-full">
            <div class="flex items-center space-x-3">
                <div class="loader h-2 w-2 border-2 border-t-[#0e639c]"></div>
                <span class="text-[#858585] text-sm font-medium">Processing query...</span>
            </div>
        </div>
    `;
    chatContainer.appendChild(loadingDiv);
}

async function sendMessage() {
    const question = questionInput.value.trim();
    if (!question) {
        return;
    }
    
    // Add the user's message.
    addMessage(question, true);
    questionInput.value = '';
    
    // Start a new (hidden) assistant message block for the answer.
    startNewAssistantAnswer();
    
    showLoading();

    vscode.postMessage({
        command: "chat",
        question
    });
}

// Event listeners
submitBtn.addEventListener('click', sendMessage);

questionInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

modelSelector.addEventListener('change', function(e) {
    const selectedModel = e.target.value;
    vscode.postMessage({ command: "selectedModel", selectedModel });
});

window.addEventListener('message', event => {
    const { command, text, availableModels, selectedModel } = event.data;
    if (command === "chatResponse") {
        updateLastAssistantMessage(text);
    } else if (command === "ollamaInstallErorr") {
        document.getElementById('ollamaError').classList.remove('hidden');
    } else if (command === "ollamaModelsNotDownloaded") {
        document.getElementById('ollamaError').classList.remove('hidden');
    }
    if (availableModels && selectedModel) {
        populateModelSelector(availableModels, selectedModel);
    }
});
