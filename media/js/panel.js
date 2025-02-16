const vscode = acquireVsCodeApi();
const chatContainer = document.getElementById('chatContainer');
const questionInput = document.getElementById('questionInput');
const submitBtn = document.getElementById('submitBtn');
const modelSelector = document.getElementById('modelSelector');
const refreshBtn = document.getElementById('refreshBtn');
const historyBtn = document.getElementById('historyBtn');
const historyPanel = document.getElementById('historyPanel');
const closeHistoryBtn = document.getElementById('closeHistoryBtn');
const historyList = document.getElementById('historyList');
const historyCount = document.getElementById('historyCount');
const historySearch = document.getElementById('historySearch');
const sendIcon = document.getElementById('sendIcon');
const stopIcon = document.getElementById('stopIcon');

let currentAssistantMessage = null;
let autoScrollEnabled = true;  // flag to control auto-scroll
let isGenerating = false;

function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

chatContainer.addEventListener('scroll', () => {
    // If near the bottom (within 50px), allow auto scrolling.
    if (chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < 50) {
        autoScrollEnabled = true;
    } else {
        autoScrollEnabled = false;
    }
});

window.onload = function() {
    questionInput.focus();
};

document.addEventListener('DOMContentLoaded', () => {
    hljs.configure({ignoreUnescapedHTML: true});
    hljs.addPlugin(new CopyButtonPlugin({ autohide: false }));
});

questionInput.addEventListener('input', () => {
    // automatically resize text area based on input
    questionInput.style.height = 'auto';
    questionInput.style.height = questionInput.scrollHeight + 'px';
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

    if (autoScrollEnabled) {
        scrollToBottom();
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

    if (autoScrollEnabled) {
        scrollToBottom();
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

    if (autoScrollEnabled) {
        scrollToBottom();
    }
}

function updateHistoryCount() {
    const count = historyList.children.length;
    historyCount.textContent = count.toString();
}

function filterHistory(searchText) {
    const historyItems = Array.from(historyList.children);
    const searchLower = searchText.toLowerCase();
    
    historyItems.forEach(item => {
        const question = item.querySelector('p').textContent.toLowerCase();
        if (question.includes(searchLower)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

historySearch.addEventListener('input', debounce((e) => {
    filterHistory(e.target.value);
}, 300));

function addToHistory(question, timestamp = new Date().toLocaleTimeString(), answer = '', skipStorage = false) {
    const historyItem = document.createElement('div');
    historyItem.className = 'p-3 bg-[#2d2d2d] rounded-lg hover:bg-[#3c3c3c] cursor-pointer transition-colors group relative';
    
    historyItem.setAttribute('data-question', question);
    
    const truncatedQuestion = question.length > 60 
        ? question.substring(0, 57) + '...' 
        : question;

    historyItem.innerHTML = `
        <div class="flex justify-between items-start gap-2">
            <p class="text-sm text-[#d4d4d4] group-hover:text-white transition-colors">${truncatedQuestion}</p>
            <div class="flex items-center gap-2">
                <span class="text-xs text-[#858585]">${timestamp}</span>
                <button class="delete-history-item opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[#ff4444] rounded">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[#858585] hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    `;

    // Add click event for delete button
    const deleteBtn = historyItem.querySelector('.delete-history-item');
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        vscode.postMessage({
            command: "deleteHistoryItem",
            question: question,
            timestamp: timestamp
        });
        historyItem.remove();
        updateHistoryCount();
    });

    // Add click event for loading the chat
    historyItem.addEventListener('click', () => {
        clearChat();
        addMessage(question, true);
        if (answer) {
            addMessage(answer, false);
        }
        questionInput.value = question;
        questionInput.style.height = 'auto';
        questionInput.style.height = questionInput.scrollHeight + 'px';
        historyPanel.classList.remove('open');
        questionInput.focus();
    });

    historyList.insertBefore(historyItem, historyList.firstChild);
    updateHistoryCount();
}

function toggleGeneratingState(generating) {
    isGenerating = generating;
    if (generating) {
        sendIcon.classList.add('hidden');
        stopIcon.classList.remove('hidden');
        submitBtn.classList.add('bg-red-600', 'hover:bg-red-700');
        submitBtn.classList.remove('bg-[#0066AD]', 'hover:bg-[#004d80]');
    } else {
        sendIcon.classList.remove('hidden');
        stopIcon.classList.add('hidden');
        submitBtn.classList.remove('bg-red-600', 'hover:bg-red-700');
        submitBtn.classList.add('bg-[#0066AD]', 'hover:bg-[#004d80]');
    }
}

async function sendMessage() {

    if (isGenerating) {
        vscode.postMessage({ command: 'stopResponse' });
        toggleGeneratingState(false);
        return;
    }

    const question = questionInput.value.trim();
    if (!question) {
        return;
    }

    // Add to history UI only (storage will happen after we get the response)
    addToHistory(question, new Date().toLocaleTimeString(), '', true);

    toggleGeneratingState(true);
    refreshBtn.disabled = true;
    
    addMessage(question, true);
    questionInput.value = '';
    questionInput.style.height = 'auto';
    
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
    } else if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault(); 
        clearChat();
    }
});

modelSelector.addEventListener('change', function(e) {
    const selectedModel = e.target.value;
    vscode.postMessage({ command: "selectedModel", selectedModel });
});

function clearChat() {
    const chatContainer = document.getElementById('chatContainer');
    
    // Preserve these elements (header/model selector)
    const preservedElements = Array.from(chatContainer.children).filter(child => {
        return child.classList.contains('text-center') || // Header container
               child.classList.contains('loading-indicator'); // Any loading indicators
    });

    // Remove all children except preserved elements
    while (chatContainer.firstChild) {
        chatContainer.removeChild(chatContainer.firstChild);
    }

    // Add back preserved elements
    preservedElements.forEach(element => {
        chatContainer.appendChild(element);
    });

    currentAssistantMessage = null;
    questionInput.focus();

    // Notify extension to clear conversation
    vscode.postMessage({ command: "newChat" });
}

refreshBtn.addEventListener('click', clearChat);

window.addEventListener('message', event => {
    const { command, text, availableModels, selectedModel, messageStreamEnded, history } = event.data;
    
    if (command === "loadHistory" && history) {
        historyList.innerHTML = '';
        history.forEach(item => {
            addToHistory(item.question, item.timestamp, item.answer, true);
        });
        updateHistoryCount();
    } else if (command === "updateHistoryAnswer") {
        // Find and update the history item
        const historyItems = Array.from(historyList.children);
        const targetItem = historyItems.find(item => {
            const itemQuestion = item.querySelector('p').textContent;
            const itemTimestamp = item.querySelector('span').textContent;
            return itemQuestion === command && itemTimestamp === text;
        });
        
        if (targetItem) {
            // Update the click handler with the new answer
            targetItem.onclick = () => {
                clearChat();
                addMessage(command, true);
                addMessage(text, false);
                questionInput.value = command;
                questionInput.style.height = 'auto';
                questionInput.style.height = questionInput.scrollHeight + 'px';
                historyPanel.classList.remove('open');
                questionInput.focus();
            };
        }
    } else if (command === "chatResponse") {
        updateLastAssistantMessage(text);
    } else if (command === "ollamaInstallErorr") {
        document.getElementById('ollamaError').classList.remove('hidden');
        submitBtn.disabled = false;
        refreshBtn.disabled = false;
    } else if (command === "ollamaModelsNotDownloaded") {
        const ollamaError = document.getElementById('ollamaError');
        ollamaError.innerHTML = `
            <p class="font-bold">Error: Model Not Available</p>
            <p>The configured model is not available. Please download it first or choose a different model.</p>
        `;
        ollamaError.classList.remove('hidden');
        submitBtn.disabled = false;
        refreshBtn.disabled = false;
    } else if (messageStreamEnded === true) {
        submitBtn.disabled = false;
        refreshBtn.disabled = false;
        toggleGeneratingState(false);
    }
    if (availableModels && selectedModel) {
        populateModelSelector(availableModels, selectedModel);
    }
});

historyBtn.addEventListener('click', () => {
    historyPanel.classList.add('open');
});

closeHistoryBtn.addEventListener('click', () => {
    historyPanel.classList.remove('open');
    historySearch.value = '';
    filterHistory('');
});

function clearHistory() {
    historyList.innerHTML = '';
    updateHistoryCount();
    historySearch.value = '';
    vscode.postMessage({ command: "clearHistory" });
}
