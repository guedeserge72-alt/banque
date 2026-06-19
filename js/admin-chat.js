/* js/admin-chat.js - Secure V2 Admin Chat Controller */

const API_BASE_URL =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3001'
        : 'https://myboamali-server.onrender.com';

// State management variables
let activeConversationId = null;
let activeUserId = null;
let activeClientName = "";
let pollingIntervalId = null;
let searchDebounceTimeoutId = null;
let currentSearchQuery = "";

document.addEventListener('DOMContentLoaded', () => {
    initAdminApp();
});

// 1. App Startup Init
function initAdminApp() {
    const token = sessionStorage.getItem('adminToken');
    
    // Bind authentication UI events
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleAdminLogin);
    }
    
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', handleAdminLogout);
    }
    
    const btnRefresh = document.getElementById('btn-refresh');
    if (btnRefresh) {
        btnRefresh.addEventListener('click', () => {
            loadConversationsList(true);
        });
    }

    const btnMarkRead = document.getElementById('btn-mark-read');
    if (btnMarkRead) {
        btnMarkRead.addEventListener('click', handleMarkAsRead);
    }

    const replyForm = document.getElementById('reply-form');
    if (replyForm) {
        replyForm.addEventListener('submit', handleAdminReplySubmit);
    }

    const replyTextarea = document.getElementById('reply-textarea');
    if (replyTextarea) {
        // Enforce Shift+Enter for newline, Enter to submit
        replyTextarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAdminReplySubmit(e);
            }
        });

        // Track character count
        replyTextarea.addEventListener('input', () => {
            const count = replyTextarea.value.length;
            const counter = document.getElementById('reply-char-count');
            if (counter) counter.textContent = count;
            updateReplyFormState();
        });
    }

    // Search events
    const searchInput = document.getElementById('search-input');
    const btnClearSearch = document.getElementById('btn-clear-search');
    
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const val = searchInput.value.trim();
            if (val.length > 0) {
                btnClearSearch.classList.remove('hidden');
            } else {
                btnClearSearch.classList.add('hidden');
            }
            // Debounce search requests
            clearTimeout(searchDebounceTimeoutId);
            searchDebounceTimeoutId = setTimeout(() => {
                handleSearchInput(val);
            }, 350);
        });
    }

    if (btnClearSearch) {
        btnClearSearch.addEventListener('click', () => {
            searchInput.value = '';
            btnClearSearch.classList.add('hidden');
            handleSearchInput('');
        });
    }

    // Filter toggling
    const filterUnread = document.getElementById('filter-unread');
    if (filterUnread) {
        filterUnread.addEventListener('change', () => {
            loadConversationsList(true);
        });
    }

    // Mobile back button navigation
    const btnBackToList = document.getElementById('btn-back-to-list');
    if (btnBackToList) {
        btnBackToList.addEventListener('click', () => {
            const body = document.querySelector('.workspace-body');
            if (body) body.classList.remove('show-chat-view');
            activeConversationId = null;
        });
    }

    // Retry list load
    const linkRetryList = document.getElementById('link-retry-list');
    if (linkRetryList) {
        linkRetryList.addEventListener('click', (e) => {
            e.preventDefault();
            loadConversationsList(true);
        });
    }

    // Visibility-aware Polling Loop Setup
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            startPolling();
            // Immediate refresh on focus
            if (sessionStorage.getItem('adminToken')) {
                loadConversationsList(false);
                if (activeConversationId) {
                    loadConversationMessages(activeConversationId, false);
                }
            }
        } else {
            stopPolling();
        }
    });

    if (token) {
        showView('admin');
        loadConversationsList(true);
        startPolling();
    } else {
        showView('login');
    }

    updateReplyFormState();
}

// 2. View management transitions
function showView(viewName) {
    const loginView = document.getElementById('login-container');
    const adminView = document.getElementById('admin-container');
    
    if (viewName === 'admin') {
        loginView.classList.remove('active');
        adminView.classList.add('active');
    } else {
        adminView.classList.remove('active');
        loginView.classList.add('active');
        stopPolling();
    }

    updateReplyFormState();
}

// 3. API Helpers with token management
function fetchWithAuth(url, options = {}) {
    const token = sessionStorage.getItem('adminToken');
    if (!options.headers) {
        options.headers = {};
    }
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return fetch(url, options)
        .then(response => {
            if (response.status === 401) {
                // Token invalid or expired, force logout
                showAdminToast('Session expirée ou invalide. Déconnexion.', 'error');
                handleAdminLogout();
                throw new Error('Unauthorized');
            }
            return response;
        })
        .catch(err => {
            updateApiStatus(false);
            throw err;
        });
}

function updateApiStatus(isOnline) {
    const dot = document.getElementById('api-status-dot');
    const txt = document.getElementById('api-status-text');
    if (dot && txt) {
        if (isOnline) {
            dot.className = 'status-dot online';
            txt.textContent = "Connecté à l'API";
        } else {
            dot.className = 'status-dot offline';
            txt.textContent = "API non disponible";
        }
    }
}

// 4. Admin Auth Handlers
function handleAdminLogin(e) {
    e.preventDefault();
    
    const passwordInput = document.getElementById('admin-password');
    const btnSubmit = document.getElementById('btn-login-submit');
    const spinner = btnSubmit.querySelector('.btn-spinner');
    const errorBox = document.getElementById('login-error');
    
    if (!passwordInput) return;
    const password = passwordInput.value;
    
    // UI Loading state
    btnSubmit.disabled = true;
    if (spinner) spinner.classList.remove('hidden');
    errorBox.classList.add('hidden');
    
    fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
    })
    .then(res => {
        if (res.status === 429) {
            throw new Error('Trop de tentatives. Veuillez réessayer plus tard (15 min).');
        }
        if (!res.ok) {
            throw new Error('Mot de passe incorrect ou accès refusé.');
        }
        return res.json();
    })
    .then(data => {
        btnSubmit.disabled = false;
        if (spinner) spinner.classList.add('hidden');
        passwordInput.value = '';
        
        if (data.success && data.token) {
            sessionStorage.setItem('adminToken', data.token);
            showView('admin');
            showAdminToast('Connexion réussie', 'success');
            loadConversationsList(true);
            startPolling();
        } else {
            throw new Error(data.error || 'Erreur lors de la connexion');
        }
    })
    .catch(err => {
        btnSubmit.disabled = false;
        if (spinner) spinner.classList.add('hidden');
        errorBox.textContent = err.message;
        errorBox.classList.remove('hidden');
        showAdminToast(err.message, 'error');
    });
}

function handleAdminLogout() {
    sessionStorage.removeItem('adminToken');
    activeConversationId = null;
    activeUserId = null;
    activeClientName = "";
    
    const welcome = document.getElementById('chat-welcome-state');
    const active = document.getElementById('chat-active-state');
    const body = document.querySelector('.workspace-body');
    
    if (welcome) welcome.classList.remove('hidden');
    if (active) active.classList.add('hidden');
    if (body) body.classList.remove('show-chat-view');
    
    showView('login');
}

// 5. Polling Loop Implementation
function startPolling() {
    stopPolling(); // Clear existing loops
    if (sessionStorage.getItem('adminToken') && document.visibilityState === 'visible') {
        pollingIntervalId = setInterval(() => {
            if (sessionStorage.getItem('adminToken')) {
                loadConversationsList(false);
                if (activeConversationId) {
                    loadConversationMessages(activeConversationId, false);
                }
            }
        }, 10000); // 10 seconds polling loop
    }
}

function stopPolling() {
    if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
        pollingIntervalId = null;
    }
}

// 6. Search Input Handling
function handleSearchInput(query) {
    currentSearchQuery = query;
    loadConversationsList(true);
}

// 7. Load Conversations List
function loadConversationsList(showLoader = false) {
    const listContainer = document.getElementById('conversations-list');
    const loader = document.getElementById('list-loader');
    const errorBox = document.getElementById('list-error');
    const emptyBox = document.getElementById('list-empty');
    const filterUnread = document.getElementById('filter-unread');
    
    if (showLoader) {
        loader.classList.remove('hidden');
        errorBox.classList.add('hidden');
        emptyBox.classList.add('hidden');
        if (listContainer) listContainer.innerHTML = '';
    }

    let url = `${API_BASE_URL}/api/admin/chat/conversations?page=1&limit=50`;
    
    // Add filters
    if (filterUnread && filterUnread.checked) {
        url += '&unread=true';
    }
    
    // Check if we are searching
    if (currentSearchQuery.length >= 2) {
        url = `${API_BASE_URL}/api/admin/chat/search?q=${encodeURIComponent(currentSearchQuery)}&page=1&limit=50`;
    }

    fetchWithAuth(url)
    .then(res => {
        if (!res.ok) throw new Error('Failed to load conversations');
        return res.json();
    })
    .then(data => {
        updateApiStatus(true);
        loader.classList.add('hidden');
        errorBox.classList.add('hidden');
        
        if (data.success) {
            renderConversationsList(data.conversations);
        } else {
            throw new Error(data.error || 'Server error');
        }
    })
    .catch(err => {
        if (err.message !== 'Unauthorized') {
            loader.classList.add('hidden');
            if (showLoader) {
                errorBox.classList.remove('hidden');
            }
        }
    });
}

// 8. Render Conversations list cards
function renderConversationsList(conversations) {
    const listContainer = document.getElementById('conversations-list');
    const emptyBox = document.getElementById('list-empty');
    
    if (!listContainer) return;
    
    if (!conversations || conversations.length === 0) {
        listContainer.innerHTML = '';
        emptyBox.classList.remove('hidden');
        return;
    }
    
    emptyBox.classList.add('hidden');
    
    // Store current scroll or list items
    const existingCards = Array.from(listContainer.querySelectorAll('.conv-card'));
    
    listContainer.innerHTML = '';
    
    conversations.forEach(c => {
        const card = document.createElement('div');
        card.className = `conv-card ${c.unreadByAdmin > 0 ? 'unread' : ''} ${activeConversationId === c.conversationId ? 'active' : ''}`;
        card.setAttribute('data-id', c.conversationId);
        card.setAttribute('data-user-id', c.userId);
        card.setAttribute('data-client-name', c.userDisplayName);
        
        const avatarText = c.userInitiales || c.userDisplayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'BJ';

        const avatarWrapper = document.createElement('div');
        avatarWrapper.className = 'avatar-wrapper';

        const avatar = document.createElement('div');
        avatar.className = 'conv-avatar';
        avatar.textContent = avatarText;
        avatarWrapper.appendChild(avatar);

        if (c.unreadByAdmin > 0) {
            const unreadBadge = document.createElement('div');
            unreadBadge.className = 'conv-unread-badge';
            unreadBadge.textContent = String(c.unreadByAdmin);
            avatarWrapper.appendChild(unreadBadge);
        }

        const details = document.createElement('div');
        details.className = 'conv-details';

        const headerRow = document.createElement('div');
        headerRow.className = 'conv-row-header';

        const name = document.createElement('span');
        name.className = 'conv-name';
        name.textContent = c.userDisplayName;

        const time = document.createElement('span');
        time.className = 'conv-time';
        time.textContent = formatRelativeDate(c.lastMessageAt);

        headerRow.appendChild(name);
        headerRow.appendChild(time);

        const userId = document.createElement('div');
        userId.className = 'conv-user-id';
        userId.textContent = `ID: ${c.userId}`;

        const preview = document.createElement('div');
        preview.className = 'conv-preview';
        preview.textContent = c.lastMessagePreview || '';

        details.appendChild(headerRow);
        details.appendChild(userId);
        details.appendChild(preview);

        card.appendChild(avatarWrapper);
        card.appendChild(details);
        
        // Add open event
        card.addEventListener('click', () => {
            selectConversation(c.conversationId, c.userId, c.userDisplayName);
        });
        
        listContainer.appendChild(card);
    });
}

// 9. Select conversation card action
function selectConversation(conversationId, userId, clientName) {
    activeConversationId = conversationId;
    activeUserId = userId;
    activeClientName = clientName;
    
    // UI state active cards
    const cards = document.querySelectorAll('.conv-card');
    cards.forEach(card => {
        if (card.getAttribute('data-id') === conversationId) {
            card.classList.add('active');
            card.classList.remove('unread');
            const badge = card.querySelector('.conv-unread-badge');
            if (badge) badge.remove();
        } else {
            card.classList.remove('active');
        }
    });

    // Mobile slide transition
    const body = document.querySelector('.workspace-body');
    if (body) body.classList.add('show-chat-view');

    // Populate active details
    const activeNameEl = document.getElementById('active-client-name');
    const activeIdEl = document.getElementById('active-client-id');
    const activeAvatarEl = document.getElementById('active-client-avatar');
    
    if (activeNameEl) activeNameEl.textContent = clientName;
    if (activeIdEl) activeIdEl.textContent = `ID Client: ${userId}`;
    if (activeAvatarEl) {
        activeAvatarEl.textContent = clientName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'BJ';
    }

    const welcome = document.getElementById('chat-welcome-state');
    const active = document.getElementById('chat-active-state');
    
    if (welcome) welcome.classList.add('hidden');
    if (active) active.classList.remove('hidden');

    // Reset textarea form
    const textarea = document.getElementById('reply-textarea');
    if (textarea) {
        textarea.value = '';
        const counter = document.getElementById('reply-char-count');
        if (counter) counter.textContent = '0';
    }
    const replyError = document.getElementById('reply-error');
    if (replyError) replyError.textContent = '';
    updateReplyFormState();

    // Load messages
    loadConversationMessages(conversationId, true);
    
    // Automatically trigger mark-as-read
    triggerApiMarkAsRead(conversationId);
}

// 10. Load Messages for Active Conversation
function loadConversationMessages(conversationId, showLoader = false) {
    const messagesContainer = document.getElementById('chat-messages-container');
    const loader = document.getElementById('messages-loader');
    const errorBox = document.getElementById('messages-error');
    
    if (showLoader) {
        loader.classList.remove('hidden');
        errorBox.classList.add('hidden');
        if (messagesContainer) messagesContainer.innerHTML = '';
    }

    fetchWithAuth(`${API_BASE_URL}/api/admin/chat/conversations/${conversationId}`)
    .then(res => {
        if (!res.ok) throw new Error('Failed to load messages');
        return res.json();
    })
    .then(data => {
        updateApiStatus(true);
        loader.classList.add('hidden');
        errorBox.classList.add('hidden');
        
        if (data.success && activeConversationId === conversationId) {
            renderMessagesFeed(data.messages);
        } else if (activeConversationId === conversationId) {
            throw new Error(data.error || 'Server error');
        }
    })
    .catch(err => {
        if (err.message !== 'Unauthorized' && activeConversationId === conversationId) {
            loader.classList.add('hidden');
            if (showLoader) {
                errorBox.classList.remove('hidden');
            }
        }
    });
}

// 11. Render Messages List inside feed
function renderMessagesFeed(messages) {
    const container = document.getElementById('chat-messages-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!messages || messages.length === 0) {
        return;
    }
    
    messages.forEach(msg => {
        const row = document.createElement('div');
        row.className = `chat-msg-row ${msg.senderType === 'user' ? 'msg-user' : 'msg-admin'}`;
        
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble';
        
        // Securely inject text content (XSS protection)
        const textSpan = document.createElement('span');
        textSpan.textContent = msg.content;
        bubble.appendChild(textSpan);
        
        const timeSpan = document.createElement('span');
        timeSpan.className = 'chat-msg-time';
        timeSpan.textContent = formatMessageTime(msg.createdAt);
        bubble.appendChild(timeSpan);
        
        row.appendChild(bubble);
        container.appendChild(row);
    });
    
    // Scroll to bottom
    const area = document.querySelector('.chat-messages-scroll-area');
    if (area) {
        area.scrollTop = area.scrollHeight;
    }
}

// 12. Submit Reply Action
function handleAdminReplySubmit(e) {
    e.preventDefault();
    
    const textarea = document.getElementById('reply-textarea');
    const replyError = document.getElementById('reply-error');
    const btnSend = document.getElementById('btn-reply-send');
    
    if (!textarea || !activeConversationId) return;
    
    const message = textarea.value.trim();
    if (!message) {
        replyError.textContent = 'Message vide refuse';
        updateReplyFormState();
        return;
    }
    
    if (message.length > 1000) {
        replyError.textContent = "Message trop long (max 1000 caractères)";
        updateReplyFormState();
        return;
    }
    
    // UI Lock state
    textarea.disabled = true;
    btnSend.disabled = true;
    replyError.textContent = '';
    
    fetchWithAuth(`${API_BASE_URL}/api/admin/chat/reply`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            conversationId: activeConversationId,
            message: message
        })
    })
    .then(res => {
        if (!res.ok) throw new Error('Erreur d\'envoi de la réponse');
        return res.json();
    })
    .then(data => {
        textarea.disabled = false;
        btnSend.disabled = false;
        
        if (data.success) {
            textarea.value = '';
            const counter = document.getElementById('reply-char-count');
            if (counter) counter.textContent = '0';
            updateReplyFormState();
            
            // Reload message feed
            loadConversationMessages(activeConversationId, false);
            // Refresh conversation previews in sidebar
            loadConversationsList(false);
        } else {
            throw new Error(data.error || 'Erreur interne');
        }
    })
    .catch(err => {
        textarea.disabled = false;
        btnSend.disabled = false;
        if (err.message !== 'Unauthorized') {
            replyError.textContent = err.message;
            showAdminToast(err.message, 'error');
        }
        updateReplyFormState();
    });
}

// 13. Mark Conversation As Read Actions
function handleMarkAsRead() {
    if (!activeConversationId) return;
    triggerApiMarkAsRead(activeConversationId, true);
}

function triggerApiMarkAsRead(conversationId, showToastNotification = false) {
    fetchWithAuth(`${API_BASE_URL}/api/admin/chat/mark-read`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ conversationId })
    })
    .then(res => {
        if (!res.ok) throw new Error('Mark read request failed');
        return res.json();
    })
    .then(data => {
        if (data.success) {
            if (showToastNotification) {
                showAdminToast('Conversation marquée comme lue', 'success');
            }
            // Update counts by refreshing list silently
            loadConversationsList(false);
        }
    })
    .catch(err => {
        console.error('Failed to mark read:', err);
    });
}

// 14. Toast alert banner injection
function showAdminToast(message, type = 'success') {
    const container = document.getElementById('admin-toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    // Automatically fade out after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse forwards';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// 15. Helper Format Functions
function updateReplyFormState() {
    const textarea = document.getElementById('reply-textarea');
    const btnSend = document.getElementById('btn-reply-send');
    const replyError = document.getElementById('reply-error');
    if (!textarea || !btnSend) return;

    const trimmedMessage = textarea.value.trim();
    const isInvalid = !activeConversationId || trimmedMessage.length === 0 || trimmedMessage.length > 1000 || textarea.disabled;
    btnSend.disabled = isInvalid;

    if (replyError && replyError.textContent === 'Message vide refuse' && trimmedMessage.length > 0) {
        replyError.textContent = '';
    }
}

function formatRelativeDate(dateString) {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (60 * 1000));
        const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
        
        if (diffMins < 1) return 'À l\'instant';
        if (diffMins < 60) return `Il y a ${diffMins} min`;
        if (diffHours < 24) return `Il y a ${diffHours} h`;
        
        // Return structured date format
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${day}/${month}`;
    } catch (e) {
        return '';
    }
}

function formatMessageTime(dateString) {
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return '';
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    } catch (e) {
        return '';
    }
}
