const vscode = acquireVsCodeApi();
const chatContainer = document.getElementById('chatContainer');
const questionInput = document.getElementById('questionInput');
const submitBtn = document.getElementById('submitBtn');

window.onload = function() {
    questionInput.focus();
};

document.addEventListener('DOMContentLoaded', () => {
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

function addMessage(content, isUser = true) {
    const loadingIndicator = chatContainer.querySelector('.loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`;
    messageDiv.innerHTML = `<div class="max-w-3xl w-full p-4 rounded-lg ${
        isUser 
            ? 'bg-[#0066AD] text-[#ffffff] mx-auto'
            : 'bg-[#252526] text-[#d4d4d4] border border-[#404040] mx-auto'
    } shadow-lg transition-all duration-200 hover:shadow-xl"><div class="prose max-w-none"><div class="whitespace-pre-wrap [&_a]:text-[#3794ff] [&_a:hover]:text-[#4aa0ff] [&_code]:bg-[#373737]">${isUser ? content : md.render(content)}</div></div></div>`;

    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return messageDiv;
}


function updateLastAssistantMessage(content) {
    const loadingIndicator = chatContainer.querySelector('.loading-indicator');
    if (loadingIndicator) {loadingIndicator.remove();};

    const assistantMessages = chatContainer.querySelectorAll('.justify-start');
    if (assistantMessages.length > 0) {
        const lastAssistantMessage = assistantMessages[assistantMessages.length - 1];
        const contentDiv = lastAssistantMessage.querySelector('.whitespace-pre-wrap');
        if (contentDiv) {
            contentDiv.innerHTML = md.render(content);
            hljs.highlightAll();
        }
    } else {
        addMessage(content, false);
    }
    chatContainer.scrollTop = chatContainer.scrollHeight;
}


function showLoading() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'flex justify-start loading-indicator mb-6';
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
    if (!question) {return;};

    addMessage(question, true);
    questionInput.value = '';
    showLoading();

    vscode.postMessage({ command: "chat", question });
}

// Event listeners
submitBtn.addEventListener('click', sendMessage);

questionInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

window.addEventListener('message', event => {
    const { command, text } = event.data;
    if (command === "chatResponse") {updateLastAssistantMessage(text);}
});
