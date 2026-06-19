/* js/chat.js - MyBOA Integrated Chat Engine */

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:'
    ? 'http://localhost:3001'
    : 'https://myboamali-server.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    initMyBoaChat();
});

// Helper to scroll messages to bottom
function scrollToBottom() {
    const area = document.getElementById('chat-messages-area');
    if (area) {
        area.scrollTop = area.scrollHeight;
    }
}

// 1. Initialisation
function initMyBoaChat() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    
    // Elements to control visibility
    const btnDesktop = document.getElementById('btn-assistance-desktop');
    const btnMobile = document.getElementById('btn-assistance-mobile');
    const chatContainer = document.getElementById('myboa-chat');

    if (!isLoggedIn) {
        // If not logged in, hide everything
        if (btnDesktop) btnDesktop.style.display = 'none';
        if (btnMobile) btnMobile.style.display = 'none';
        if (chatContainer) chatContainer.style.display = 'none';
        return;
    }

    // Ensure buttons are visible
    if (btnDesktop) btnDesktop.style.display = 'flex';
    if (btnMobile) btnMobile.style.display = 'inline-flex';
    if (chatContainer) chatContainer.style.display = 'flex';

    // Bind event listeners
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
        // Submit on Enter
        inputMsg.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
            }
        });

        // Track characters count
        inputMsg.addEventListener('input', () => {
            const countSpan = document.getElementById('chat-char-count');
            if (countSpan) {
                countSpan.textContent = inputMsg.value.length;
            }
            // Auto resize height
            inputMsg.style.height = 'auto';
            inputMsg.style.height = Math.min(80, inputMsg.scrollHeight) + 'px';
        });
    }

    // Setup visual viewport syncing for mobile keyboard
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', syncChatWithLayout);
        window.visualViewport.addEventListener('scroll', syncChatWithLayout);
    }

    // Auto-detect and close chat on clicks outside (for desktop drawer)
    document.addEventListener('click', (e) => {
        if (window.innerWidth >= 768 && chatContainer && chatContainer.classList.contains('open')) {
            // Check if click was outside chat panel and not on assistance buttons
            const isClickInside = chatContainer.contains(e.target);
            const isClickOnBtnDesktop = btnDesktop && btnDesktop.contains(e.target);
            const isClickOnBtnMobile = btnMobile && btnMobile.contains(e.target);

            if (!isClickInside && !isClickOnBtnDesktop && !isClickOnBtnMobile) {
                closeChat();
            }
        }
    });
}

// 2. Safe Retrieval of User details
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

// 3. UI Toggle actions
function openChat() {
    const chatContainer = document.getElementById('myboa-chat');
    if (chatContainer) {
        chatContainer.classList.add('open');
        syncChatWithLayout();
        
        // Hide badge if visible
        const badge = document.getElementById('chat-notif-badge');
        if (badge) badge.style.display = 'none';

        // Focus message field
        const inputMsg = document.getElementById('chat-message-input');
        if (inputMsg) {
            setTimeout(() => inputMsg.focus(), 250);
        }

        // Load messages history
        loadChatHistory();
    }
}

function closeChat() {
    const chatContainer = document.getElementById('myboa-chat');
    if (chatContainer) {
        chatContainer.classList.remove('open');
    }
}

function toggleChat() {
    const chatContainer = document.getElementById('myboa-chat');
    if (chatContainer) {
        if (chatContainer.classList.contains('open')) {
            closeChat();
        } else {
            openChat();
        }
    }
}

// 4. Fetch history
function loadChatHistory() {
    setChatLoading(true);
    setChatError(false);

    const userId = getChatUserId();
    
    fetch(`${API_BASE_URL}/api/chat/messages/${userId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('API return non-200 status');
            }
            return response.json();
        })
        .then(data => {
            setChatLoading(false);
            if (data.success) {
                renderChatMessages(data.messages);
            } else {
                setChatError(true);
            }
        })
        .catch(err => {
            console.error('Error loading chat history:', err);
            setChatLoading(false);
            setChatError(true);
        });
}

// 5. Render Messages
function renderChatMessages(messages) {
    const messagesArea = document.getElementById('chat-messages-area');
    if (!messagesArea) return;

    // Clear previous history rows, keeping only the first welcome message
    const welcomeMsg = messagesArea.querySelector('.chat-welcome-msg');
    messagesArea.innerHTML = '';
    if (welcomeMsg) {
        messagesArea.appendChild(welcomeMsg);
    }

    if (!messages || messages.length === 0) {
        scrollToBottom();
        return;
    }

    messages.forEach(msg => {
        const row = document.createElement('div');
        row.className = `chat-msg-row ${msg.senderType === 'user' ? 'msg-user' : 'msg-admin'}`;

        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble';
        
        // Escape HTML content text to prevent XSS / HTML rendering
        const contentSpan = document.createElement('span');
        contentSpan.textContent = msg.content;
        bubble.appendChild(contentSpan);

        const timeSpan = document.createElement('span');
        timeSpan.className = 'chat-msg-time';
        timeSpan.textContent = formatChatDate(msg.createdAt);
        bubble.appendChild(timeSpan);

        row.appendChild(bubble);
        messagesArea.appendChild(row);
    });

    scrollToBottom();
}

// 6. Send Message
function sendChatMessage() {
    const inputMsg = document.getElementById('chat-message-input');
    if (!inputMsg) return;

    const messageText = inputMsg.value.trim();
    if (!messageText) return;

    if (messageText.length > 1000) {
        alert('Votre message est trop long. Il doit faire moins de 1000 caractères.');
        return;
    }

    // Clean input
    inputMsg.value = '';
    inputMsg.style.height = 'auto';
    const countSpan = document.getElementById('chat-char-count');
    if (countSpan) countSpan.textContent = '0';

    const userId = getChatUserId();
    const user = getChatUser();

    // Optimistically render message in local history
    const messagesArea = document.getElementById('chat-messages-area');
    const localRow = document.createElement('div');
    localRow.className = 'chat-msg-row msg-user';
    
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.style.opacity = '0.7'; // Styling to indicate sending
    
    const contentSpan = document.createElement('span');
    contentSpan.textContent = messageText;
    bubble.appendChild(contentSpan);

    const timeSpan = document.createElement('span');
    timeSpan.className = 'chat-msg-time';
    timeSpan.textContent = 'Envoi...';
    bubble.appendChild(timeSpan);

    localRow.appendChild(bubble);
    messagesArea.appendChild(localRow);
    scrollToBottom();

    // Call API
    fetch(`${API_BASE_URL}/api/chat/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userId: userId,
            userDisplayName: `${user.prenom} ${user.nom}`,
            userInitiales: user.initiales,
            userEmail: 'bankof739@gmail.com', // Notification destination
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
        if (data.success) {
            // Confirm message sent
            bubble.style.opacity = '1';
            timeSpan.textContent = formatChatDate(data.message.createdAt);
        } else {
            throw new Error(data.error || 'Server rejected message');
        }
    })
    .catch(err => {
        console.error('Error sending message:', err);
        // Display failed message styling
        bubble.style.backgroundColor = '#fce8e6';
        bubble.style.color = '#c5221f';
        bubble.style.border = '1px solid #fde2e2';
        timeSpan.textContent = 'Échec - Réessayer';
        timeSpan.style.color = '#c5221f';
        
        // Show generic warning toast
        if (typeof showToast === 'function') {
            showToast('Erreur d\'assistance', 'Le message n\'a pas pu être envoyé. Veuillez réessayer.', 'info');
        }
    });
}

// 7. Loading state UI controls
function setChatLoading(isLoading) {
    const loader = document.getElementById('chat-loader');
    if (loader) {
        if (isLoading) {
            loader.classList.remove('hidden');
        } else {
            loader.classList.add('hidden');
        }
    }
}

// 8. Error state UI controls
function setChatError(hasError) {
    const errorMsg = document.getElementById('chat-error-msg');
    if (errorMsg) {
        if (hasError) {
            errorMsg.classList.remove('hidden');
        } else {
            errorMsg.classList.add('hidden');
        }
    }
}

// 9. Format helpers
function escapeChatText(text) {
    if (typeof text !== 'string') return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatChatDate(dateInput) {
    try {
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return '';
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    } catch (e) {
        return '';
    }
}

// 10. Sync chat position with layout on mobile keyboard height adjustments
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
