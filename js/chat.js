/* js/chat.js - MyBOA Integrated Chat Engine */

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:'
    ? 'http://localhost:3001'
    : 'https://myboamali-server.onrender.com';

const CHAT_POLL_INTERVAL_MS = 4000;
const CHAT_TYPING_TTL_MS = 10000;

const chatState = {
    pollingIntervalId: null,
    knownMessageIds: new Set(),
    hasLoadedHistory: false,
    isSyncing: false
};

document.addEventListener('DOMContentLoaded', () => {
    initMyBoaChat();
});

function scrollToBottom() {
    const area = document.getElementById('chat-messages-area');
    if (area) {
        area.scrollTop = area.scrollHeight;
    }
}

function isChatOpen() {
    const chatContainer = document.getElementById('myboa-chat');
    return Boolean(chatContainer && chatContainer.classList.contains('open'));
}

function isNearBottom(area, threshold = 48) {
    if (!area) return true;
    return (area.scrollHeight - area.scrollTop - area.clientHeight) <= threshold;
}

function getTypingIndicator() {
    const messagesArea = document.getElementById('chat-messages-area');
    if (!messagesArea) return null;

    let indicator = document.getElementById('chat-admin-typing');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'chat-admin-typing';
        indicator.className = 'chat-typing-indicator hidden';
        indicator.textContent = 'L\'agent est en train d\'écrire...';
        messagesArea.appendChild(indicator);
    }

    return indicator;
}

function updateTypingIndicator(adminTyping, adminTypingAt) {
    const indicator = getTypingIndicator();
    if (!indicator) return;

    const typingDate = adminTypingAt ? new Date(adminTypingAt) : null;
    const isFresh = Boolean(
        adminTyping &&
        typingDate &&
        !Number.isNaN(typingDate.getTime()) &&
        (Date.now() - typingDate.getTime()) < CHAT_TYPING_TTL_MS
    );

    indicator.classList.toggle('hidden', !isFresh || !isChatOpen());
}

function createMessageRow(msg) {
    const row = document.createElement('div');
    row.className = `chat-msg-row ${msg.senderType === 'user' ? 'msg-user' : 'msg-admin'}`;
    row.setAttribute('data-message-id', msg.messageId || '');

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';

    const contentSpan = document.createElement('span');
    contentSpan.textContent = msg.content;
    bubble.appendChild(contentSpan);

    const timeSpan = document.createElement('span');
    timeSpan.className = 'chat-msg-time';
    timeSpan.textContent = formatChatDate(msg.createdAt);
    bubble.appendChild(timeSpan);

    row.appendChild(bubble);
    return row;
}

function appendNewMessages(messages, shouldScroll) {
    const messagesArea = document.getElementById('chat-messages-area');
    if (!messagesArea || !Array.isArray(messages)) return;

    const typingIndicator = getTypingIndicator();
    const fragment = document.createDocumentFragment();
    let appendedCount = 0;

    messages.forEach(msg => {
        if (!msg || !msg.messageId || chatState.knownMessageIds.has(msg.messageId)) {
            return;
        }

        chatState.knownMessageIds.add(msg.messageId);
        fragment.appendChild(createMessageRow(msg));
        appendedCount += 1;
    });

    if (appendedCount === 0) return;

    if (typingIndicator) {
        messagesArea.insertBefore(fragment, typingIndicator);
    } else {
        messagesArea.appendChild(fragment);
    }

    if (shouldScroll) {
        scrollToBottom();
    }
}

function renderChatMessages(messages, options = {}) {
    const messagesArea = document.getElementById('chat-messages-area');
    if (!messagesArea) return;

    const shouldScroll = options.shouldScroll !== false;
    const welcomeMsg = messagesArea.querySelector('.chat-welcome-msg');

    chatState.knownMessageIds.clear();
    messagesArea.innerHTML = '';
    if (welcomeMsg) {
        messagesArea.appendChild(welcomeMsg);
    }

    getTypingIndicator();
    appendNewMessages(messages, false);

    if (shouldScroll) {
        scrollToBottom();
    }
}

function syncChatSession(options = {}) {
    if (chatState.isSyncing) return Promise.resolve();

    const userId = getChatUserId();
    const messagesArea = document.getElementById('chat-messages-area');
    const wasNearBottom = isNearBottom(messagesArea);
    const forceFullRender = options.forceFullRender === true;

    if (options.showLoader) {
        setChatLoading(true);
    }
    setChatError(false);
    chatState.isSyncing = true;

    return fetch(`${API_BASE_URL}/api/chat/messages/${userId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('API return non-200 status');
            }
            return response.json();
        })
        .then(data => {
            setChatLoading(false);
            if (!data.success) {
                setChatError(true);
                return;
            }

            const messages = Array.isArray(data.messages) ? data.messages : [];
            const shouldAutoScroll = forceFullRender || !chatState.hasLoadedHistory || wasNearBottom;

            if (forceFullRender || !chatState.hasLoadedHistory) {
                renderChatMessages(messages, { shouldScroll: shouldAutoScroll });
                chatState.hasLoadedHistory = true;
            } else {
                appendNewMessages(messages, shouldAutoScroll);
            }

            updateTypingIndicator(data.adminTyping, data.adminTypingAt);
        })
        .catch(err => {
            console.error('Error loading chat history:', err);
            setChatLoading(false);
            setChatError(true);
        })
        .finally(() => {
            chatState.isSyncing = false;
        });
}

function startChatPolling() {
    stopChatPolling();
    if (!isChatOpen() || document.visibilityState !== 'visible') return;

    chatState.pollingIntervalId = setInterval(() => {
        if (isChatOpen() && document.visibilityState === 'visible') {
            syncChatSession();
        }
    }, CHAT_POLL_INTERVAL_MS);
}

function stopChatPolling() {
    if (chatState.pollingIntervalId) {
        clearInterval(chatState.pollingIntervalId);
        chatState.pollingIntervalId = null;
    }
}

function initMyBoaChat() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';

    const btnDesktop = document.getElementById('btn-assistance-desktop');
    const btnMobile = document.getElementById('btn-assistance-mobile');
    const chatContainer = document.getElementById('myboa-chat');

    if (!isLoggedIn) {
        if (btnDesktop) btnDesktop.style.display = 'none';
        if (btnMobile) btnMobile.style.display = 'none';
        if (chatContainer) chatContainer.style.display = 'none';
        return;
    }

    if (btnDesktop) btnDesktop.style.display = 'flex';
    if (btnMobile) btnMobile.style.display = 'inline-flex';
    if (chatContainer) chatContainer.style.display = 'flex';

    if (btnDesktop) {
        btnDesktop.addEventListener('click', (e) => {
            e.preventDefault();
            toggleChat();
        });
    }

    if (btnMobile) {
        btnMobile.addEventListener('click', (e) => {
            e.preventDefault();
            toggleChat();
        });
    }

    const btnClose = document.getElementById('btn-close-chat');
    if (btnClose) {
        btnClose.addEventListener('click', closeChat);
    }

    const btnSend = document.getElementById('btn-send-chat');
    if (btnSend) {
        btnSend.addEventListener('click', sendChatMessage);
    }

    const inputMsg = document.getElementById('chat-message-input');
    if (inputMsg) {
        inputMsg.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
            }
        });

        inputMsg.addEventListener('input', () => {
            const countSpan = document.getElementById('chat-char-count');
            if (countSpan) {
                countSpan.textContent = inputMsg.value.length;
            }
            inputMsg.style.height = 'auto';
            inputMsg.style.height = Math.min(80, inputMsg.scrollHeight) + 'px';
        });
    }

    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', syncChatWithLayout);
        window.visualViewport.addEventListener('scroll', syncChatWithLayout);
    }

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && isChatOpen()) {
            syncChatSession();
            startChatPolling();
        } else {
            stopChatPolling();
        }
    });

    document.addEventListener('click', (e) => {
        if (window.innerWidth >= 768 && chatContainer && chatContainer.classList.contains('open')) {
            const isClickInside = chatContainer.contains(e.target);
            const isClickOnBtnDesktop = btnDesktop && btnDesktop.contains(e.target);
            const isClickOnBtnMobile = btnMobile && btnMobile.contains(e.target);

            if (!isClickInside && !isClickOnBtnDesktop && !isClickOnBtnMobile) {
                closeChat();
            }
        }
    });
}

function getChatUser() {
    try {
        const userStr = sessionStorage.getItem('user');
        if (userStr) {
            return JSON.parse(userStr);
        }
    } catch (e) {
        console.error('Error parsing user object from session storage:', e);
    }
    return { nom: 'Brunet', prenom: 'Jean Paul', initiales: 'BJ' };
}

function getChatUserId() {
    let userId = sessionStorage.getItem('chatUserId');
    if (!userId) {
        const user = getChatUser();
        userId = user.chatUserId || user.loginId || user.customerId;
    }
    if (!userId) {
        userId = 'boa_user_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('chatUserId', userId);
    }
    return userId;
}

function openChat() {
    const chatContainer = document.getElementById('myboa-chat');
    if (chatContainer) {
        chatContainer.classList.add('open');
        syncChatWithLayout();

        const badge = document.getElementById('chat-notif-badge');
        if (badge) badge.style.display = 'none';

        const inputMsg = document.getElementById('chat-message-input');
        if (inputMsg) {
            setTimeout(() => inputMsg.focus(), 250);
        }

        syncChatSession({ showLoader: true, forceFullRender: !chatState.hasLoadedHistory });
        startChatPolling();
    }
}

function closeChat() {
    const chatContainer = document.getElementById('myboa-chat');
    if (chatContainer) {
        chatContainer.classList.remove('open');
    }
    stopChatPolling();
    updateTypingIndicator(false, null);
}

function toggleChat() {
    if (isChatOpen()) {
        closeChat();
    } else {
        openChat();
    }
}

function sendChatMessage() {
    const inputMsg = document.getElementById('chat-message-input');
    const messagesArea = document.getElementById('chat-messages-area');
    if (!inputMsg || !messagesArea) return;

    const messageText = inputMsg.value.trim();
    if (!messageText) return;

    if (messageText.length > 1000) {
        alert('Votre message est trop long. Il doit faire moins de 1000 caractères.');
        return;
    }

    inputMsg.value = '';
    inputMsg.style.height = 'auto';
    const countSpan = document.getElementById('chat-char-count');
    if (countSpan) countSpan.textContent = '0';

    const userId = getChatUserId();
    const user = getChatUser();
    const localMessageId = 'local_' + Date.now();

    const localRow = createMessageRow({
        messageId: localMessageId,
        senderType: 'user',
        content: messageText,
        createdAt: new Date().toISOString()
    });
    const bubble = localRow.querySelector('.chat-bubble');
    const timeSpan = localRow.querySelector('.chat-msg-time');
    bubble.style.opacity = '0.7';
    timeSpan.textContent = 'Envoi...';

    const typingIndicator = getTypingIndicator();
    if (typingIndicator) {
        messagesArea.insertBefore(localRow, typingIndicator);
    } else {
        messagesArea.appendChild(localRow);
    }
    scrollToBottom();

    fetch(`${API_BASE_URL}/api/chat/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userId: userId,
            userDisplayName: `${user.prenom} ${user.nom}`,
            userInitiales: user.initiales,
            userEmail: 'bankof739@gmail.com',
            message: messageText
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('API responded with non-200 status');
            }
            return response.json();
        })
        .then(data => {
            if (!data.success) {
                throw new Error(data.error || 'Server rejected message');
            }

            if (data.message && data.message.messageId) {
                localRow.setAttribute('data-message-id', data.message.messageId);
                chatState.knownMessageIds.add(data.message.messageId);
            }

            bubble.style.opacity = '1';
            timeSpan.textContent = formatChatDate(data.message.createdAt);
            syncChatSession();
        })
        .catch(err => {
            console.error('Error sending message:', err);
            bubble.style.backgroundColor = '#fce8e6';
            bubble.style.color = '#c5221f';
            bubble.style.border = '1px solid #fde2e2';
            timeSpan.textContent = 'Échec - Réessayer';
            timeSpan.style.color = '#c5221f';

            if (typeof showToast === 'function') {
                showToast('Erreur d\'assistance', 'Le message n\'a pas pu être envoyé. Veuillez réessayer.', 'info');
            }
        });
}

function setChatLoading(isLoading) {
    const loader = document.getElementById('chat-loader');
    if (loader) {
        loader.classList.toggle('hidden', !isLoading);
    }
}

function setChatError(hasError) {
    const errorMsg = document.getElementById('chat-error-msg');
    if (errorMsg) {
        errorMsg.classList.toggle('hidden', !hasError);
    }
}

function formatChatDate(dateInput) {
    try {
        const d = new Date(dateInput);
        if (Number.isNaN(d.getTime())) return '';
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    } catch (e) {
        return '';
    }
}

function syncChatWithLayout() {
    if (window.visualViewport && window.innerWidth < 768) {
        const vv = window.visualViewport;
        const kbHeight = window.innerHeight - vv.height;
        const chatContainer = document.getElementById('myboa-chat');
        if (chatContainer) {
            chatContainer.style.setProperty('--keyboard-height', `${Math.max(0, kbHeight - 75)}px`);
        }
    }
}
