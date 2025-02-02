
const vscode = acquireVsCodeApi();
const chatContainer = document.getElementById('chatContainer');
const questionInput = document.getElementById('questionInput');
const submitBtn = document.getElementById('submitBtn');

window.onload = function() {
    document.getElementById('questionInput').focus();
};

document.addEventListener('DOMContentLoaded', () => {
    //FIXME: copy code button not working atm
    hljs.addPlugin(new CopyButtonPlugin({
        autohide: false, // Always show the copy button
    }));
});


const md = markdownit({
    highlight: function (str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return '<pre><code class="hljs">' +
                 hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
                 '</code></pre>';
        } catch (__) {}
      }
  
      return '<pre><code class="hljs">' + md.utils.escapeHtml(str) + '</code></pre>';
    }
  });

function addMessage(content, isUser = true) {
    const loadingIndicator = chatContainer.querySelector('.loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `flex ${isUser ? 'justify-start' : 'justify-start'} mb-4`;
    messageDiv.innerHTML = `
        <div class="max-w-3xl w-full p-4 rounded-lg ${
            isUser 
                ? 'bg-blue-100 dark:bg-blue-900' 
                : 'bg-gray-100 dark:bg-gray-800'
        }">
            <div class="prose dark:prose-invert">
                <div id="seekDeep" class="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    ${content}
                </div>
            </div>
        </div>
    `;

    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return messageDiv;
}

function updateLastAssistantMessage(content) {
    const loadingIndicator = chatContainer.querySelector('.loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }

    const assistantMessages = chatContainer.querySelectorAll('.justify-start');
    if (assistantMessages.length > 0) {
        const lastAssistantMessage = assistantMessages[assistantMessages.length - 1]; //WARN: harcoded might fail
        const contentDiv = Array.from(lastAssistantMessage.querySelectorAll('div')).pop();
        if (contentDiv) {
            const formattedContent = md.render(content);
            contentDiv.innerHTML = formattedContent;
        }
    } else {
        addMessage(content, false);
    }
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showLoading() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'flex justify-start loading-indicator';
    loadingDiv.innerHTML = `
        <div class="max-w-3xl p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
            <div class="flex items-center space-x-2">
                <div class="loader h-5 w-5 border-4 border-gray-200 rounded-full"></div>
                <span class="text-gray-600 dark:text-gray-300">Thinking...</span>
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
    addMessage('', false); // Add an empty assistant message
    showLoading();

    vscode.postMessage({command: "chat", question});
}

document.getElementById('questionInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); // Prevent newline
        sendMessage();
    }
});

window.addEventListener('message', event => {
    const {command, text} = event.data;
    if (command === "chatResponse"){
        updateLastAssistantMessage(text);
    }
});
