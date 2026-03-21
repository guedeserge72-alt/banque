/**
 * js/main.js - Global SPA Logic & UI Handlers
 */

// SOURCE DE DONNÉES GLOBALE : Nom de l'utilisateur
const CURRENT_USER_NAME = "BRUNET JEAN PAUL";

// SOURCE DE DONNÉES GLOBALE : Comptes du titulaire
const ORIGINAL_ACCOUNTS = [
    { id: 'CFA', libelle: "Compte Courant CFA", solde: 1311800000, devise: "CFA" }
];

// État actuel des comptes
let GLOBAL_ACCOUNTS = JSON.parse(JSON.stringify(ORIGINAL_ACCOUNTS));

// Historique des transactions
let GLOBAL_TRANSACTIONS = [];

function convertirTousMontants(devise) {
    var taux = { CFA:1, EUR:655.957, USD:600, GBP:750, CHF:620, CAD:450 };
    var symboles = { CFA:'CFA', EUR:'€', USD:'$', GBP:'£', CHF:'CHF', CAD:'CAD' };
    var t = taux[devise] || 1;
    var s = symboles[devise] || devise;

    document.querySelectorAll('[data-montant-cfa]').forEach(function(el) {
        var montantCFA = parseFloat(el.getAttribute('data-montant-cfa'));
        if (!isNaN(montantCFA)) {
            var converti = Math.round(montantCFA / t);
            var signe = montantCFA >= 0 ? '+' : '-';
            if (el.classList.contains('no-sign')) signe = '';
            el.textContent = signe + Math.abs(converti).toLocaleString('fr-FR') + ' ' + s;
        }
    });

    document.querySelectorAll('[data-solde-cfa]').forEach(function(el) {
        var soldeCFA = parseFloat(el.getAttribute('data-solde-cfa'));
        if (!isNaN(soldeCFA)) {
            var converti = Math.round(soldeCFA / t);
            el.textContent = converti.toLocaleString('fr-FR') + ' ' + s;
        }
    });

    document.querySelectorAll('[data-devise-label]').forEach(function(el) {
        el.textContent = s;
    });
}

window.convertirTousMontants = convertirTousMontants;

document.addEventListener('DOMContentLoaded', () => {
    initGlobalTransactions(); // Generate base history
    initNavigation();
    initDropdowns();
    initMobileMenu();
    initGlobalFeatures();
    initSidebarSelects(); 
});

/**
 * INITIALIZE GLOBAL TRANSACTIONS
 */
function initGlobalTransactions() {
    GLOBAL_TRANSACTIONS = generateGoldTradeHistory();
}

/**
 * GENERATE GOLD TRADE HISTORY (2005-2012)
 */
function generateGoldTradeHistory() {
    const mandatoryOps = [
        { date: '15/03/2008', type: 'Virement reçu', desc: 'Paiement lingots or — Strong Security S.A', amount: 19667550 },
        { date: '22/06/2009', type: 'Virement reçu', desc: 'Achat or brut — Strong Security S.A', amount: 16397500 },
        { date: '08/11/2010', type: 'Virement reçu', desc: 'Transaction or — Strong Security S.A', amount: 26236000 },
        { date: '30/04/2011', type: 'Virement reçu', desc: 'Règlement final or — Strong Security S.A', amount: 19667550 }
    ];

    const otherOps = [
        { date: '12/01/2005', type: 'Ouverture de compte', desc: 'Dépôt initial - Fond de roulement', amount: 150000000 },
        { date: '05/04/2005', type: 'Virement émis', desc: 'Frais de résidence - Loyer bureau Bamako', amount: -2500000 },
        { date: '20/08/2005', type: 'Virement reçu', desc: 'Vente pépites - Mali Gold Mining', amount: 45000000 },
        { date: '15/11/2005', type: 'Virement émis', desc: 'Frais de certification - Labo Analyse Sahel', amount: -850000 },
        { date: '10/02/2006', type: 'Virement reçu', desc: 'Commission sur vente - Partenaire Dubaï', amount: 85000000 },
        { date: '25/05/2006', type: 'Virement émis', desc: 'Taxes et droits douaniers - Exportation 05/06', amount: -12450000 },
        { date: '14/09/2006', type: 'Virement reçu', desc: 'Achat or - Comptoir de Sikasso', amount: 32000000 },
        { date: '02/12/2006', type: 'Virement émis', desc: 'Raffinage - Metal Precision Ltd', amount: -4500000 },
        { date: '18/03/2007', type: 'Virement reçu', desc: 'Paiement client - Golden Resource Ltd', amount: 120000000 },
        { date: '12/07/2007', type: 'Virement émis', desc: 'Transport sécurisé - Brinks Secure Solution', amount: -3200000 },
        { date: '05/10/2007', type: 'Virement reçu', desc: 'Vente or brut - Mines de Loulo', amount: 65000000 },
        { date: '20/01/2008', type: 'Virement reçu', desc: 'Paiement lingots - Swiss Gold refining', amount: 210000000 },
        { date: '10/05/2009', type: 'Virement émis', desc: 'Acquisition matériel détection', amount: -15000000 },
        { date: '15/12/2009', type: 'Virement reçu', desc: 'Transaction or - Global Trade Corp', amount: 78000000 },
        { date: '08/04/2010', type: 'Virement reçu', desc: 'Commissions ventes 1er trimestre', amount: 12500000 },
        { date: '22/09/2011', type: 'Virement émis', desc: 'Frais assurance convois précieux', amount: -5600000 },
        { date: '05/02/2012', type: 'Virement reçu', desc: 'Règlement solde annuel Or - Africa Trading', amount: 88000000 }
    ];

    // Combine manual and mandatory
    let allOps = [...mandatoryOps, ...otherOps];

    // Build timestamp and sort
    allOps = allOps.map(op => {
        const parts = op.date.split('/');
        return { ...op, timestamp: new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00`).getTime() };
    });
    allOps.sort((a, b) => a.timestamp - b.timestamp);

    // Calculate current temporary total
    let currentTotal = allOps.reduce((sum, op) => sum + op.amount, 0);

    // Add final big transaction in 2012 to reach exactly 1311800000
    const finalAmount = 1311800000 - currentTotal;
    allOps.push({
        date: '20/12/2012',
        type: 'Virement reçu',
        desc: 'Virement exceptionnel — Clôture exercice or',
        amount: finalAmount,
        timestamp: new Date('2012-12-20T12:00:00').getTime()
    });

    // Re-sort with the final transaction
    allOps.sort((a, b) => a.timestamp - b.timestamp);

    let runningBalance = 0;
    return allOps.map(op => {
        runningBalance += op.amount;
        const sign = op.amount >= 0 ? '+' : '';
        const color = op.amount >= 0 ? 'var(--primary-color)' : '#EF4444';
        return {
            dateStr: op.date,
            timestamp: op.timestamp,
            type: op.type,
            desc: op.desc,
            amountRaw: op.amount,
            amountStr: `<span style="color:${color}; font-weight:bold;" data-montant-cfa="${op.amount}">${sign}${Math.abs(op.amount).toLocaleString('fr-FR')}</span>`,
            devise: 'CFA',
            soldeStr: `<span data-solde-cfa="${runningBalance}">${runningBalance.toLocaleString('fr-FR')} CFA</span>`,
            soldeRaw: runningBalance,
            isTemporary: false
        };
    }).sort((a, b) => b.timestamp - a.timestamp); // Sort by date descending for UI
}

/**
 * MASK ACCOUNT NUMBER
 * Masque les numéros de compte pour ne garder que les 4 derniers chiffres.
 * @param {string} acc - Le numéro de compte complet
 * @returns {string} - Le numéro masqué (ex: **** **** **** 1234)
 */
function maskAccount(acc) {
    if (!acc || acc.length < 4) return acc;
    // Supprimer les espaces éventuels
    const cleanAcc = acc.replace(/\s+/g, '');
    const last4 = cleanAcc.slice(-4);
    return `**** **** **** ${last4}`;
}

/**
 * INITIALIZE SPA NAVIGATION
 * Gère le masquage/affichage des sections HTML (Accueil, Consultation, etc.)
 * et anime le loader. Met à jour le menu actif.
 */
function initNavigation() {
    const navItems = document.querySelectorAll('.navbar-menu .nav-item[data-target], .mobile-bottom-nav .mob-item[data-target]');
    const sections = document.querySelectorAll('main .section');
    const loader = document.getElementById('global-loader');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Ignorer si c'est déjà actif
            if (item.classList.contains('active')) return;

            const targetId = item.getAttribute('data-target');
            if(!targetId) return;

            // 1. Démarrer le loader
            loader.classList.add('loading');

            // 2. Retirer l'état actif de tous les menus haut et bas
            document.querySelectorAll('.navbar-menu .nav-item').forEach(n => n.classList.remove('active'));
            document.querySelectorAll('.mobile-bottom-nav .mob-item').forEach(m => m.classList.remove('active'));
            
            // Définir le nouveau menu actif (Haut)
            item.classList.add('active');
            
            // Activer aussi l'item équivalent en bas (si on clique en haut, ou inversement pour harmoniser)
            // Ligne supprimée (targetId déjà déclaré)
            const bottomNavEq = document.querySelector(`.mobile-bottom-nav .mob-item[data-target="${targetId}"]`);
            if(bottomNavEq) bottomNavEq.classList.add('active');

            // 3. Masquer toutes les sections
            sections.forEach(sec => {
                sec.classList.remove('active');
            });

            // 4. Simuler un temps de chargement pour le loader et la transition smooth
            setTimeout(() => {
                const targetSection = document.getElementById(targetId);
                if(targetSection) {
                    targetSection.classList.add('active');
                    updateBreadcrumb(item.textContent.trim() || item.querySelector('span')?.textContent.trim());
                }
                loader.classList.remove('loading');

                // Synchroniser le solde à chaque changement de section
                if (typeof afficherSolde === 'function') {
                    setTimeout(function() { afficherSolde(); }, 150);
                }
                
                // Fermer le menu mobile overlay si ouvert (cas <480px burger)
                const navbarMenu = document.querySelector('.navbar-menu');
                if(navbarMenu && navbarMenu.classList.contains('open')) {
                    navbarMenu.classList.remove('open');
                    const btnBurger = document.getElementById('btn-burger');
                    if(btnBurger) btnBurger.classList.remove('open');
                }
            }, 300); // 300ms de "loading"
        });
    });
}

/**
 * UPDATE BREADCRUMB
 * Met à jour le fil d'Ariane sous la navbar.
 * @param {string} currentSection - Le nom de la section actuelle
 */
function updateBreadcrumb(currentSection) {
    const bc = document.getElementById('breadcrumbPath');
    if (bc) {
        bc.textContent = `Home > ${currentSection}`;
    }
}

/**
 * INITIALIZE DROPDOWNS
 * Gère l'ouverture/fermeture du profil, des notifications et des actions spécifiques.
 */
function initDropdowns() {
    // Profil Dropdown
    const profileBtn = document.getElementById('btn-profile');
    const profileDropdown = document.getElementById('dropdown-profile');

    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('show');
        });
    }

    // Fermer les dropdowns quand on clique ailleurs sur la page
    document.addEventListener('click', (e) => {
        if (profileDropdown && profileDropdown.classList.contains('show')) {
            profileDropdown.classList.remove('show');
        }
        
        // Fermer aussi les dropdowns actions du tableau s'il y en a
        document.querySelectorAll('.action-dropdown.show').forEach(dd => {
            dd.classList.remove('show');
        });
    });
}

/**
 * INITIALIZE MOBILE MENU (BURGER)
 * Gère l'ouverture du menu latéral sur mobile.
 */
function initMobileMenu() {
    const burgerBtn = document.getElementById('btn-burger');
    const navbarMenu = document.querySelector('.navbar-menu');

    if (burgerBtn && navbarMenu) {
        burgerBtn.addEventListener('click', () => {
            navbarMenu.classList.toggle('open');
        });
    }
}

/**
 * INITIALIZE GLOBAL FEATURES (Search, Back to top, global data injection)
 */
function initGlobalFeatures() {
    // Inject centralized User Name from Session if available
    const sessionUser = JSON.parse(sessionStorage.getItem('user') || '{}');
    const displayName = sessionUser.nom ? `${sessionUser.prenom} ${sessionUser.nom}`.toUpperCase() : CURRENT_USER_NAME;
    const initiales = sessionUser.initiales || 'BJ';

    const headerName = document.getElementById('header-user-name');
    if (headerName) headerName.textContent = displayName;
    
    // Also update card info just to be sure it explicitly uses the global source
    const mockCcName = document.getElementById('mock-cc-name');
    if (mockCcName) mockCcName.textContent = displayName;
    
    const detailCcName = document.getElementById('detail-cc-name');
    if (detailCcName) detailCcName.textContent = displayName;

    const badge = document.getElementById('user-avatar-badge');
    if (badge) {
        badge.textContent = initiales;
        badge.title = displayName;
    }
    // -------------------------------

    syncDashboardUI();

    // Back to Top Button
    const backToTop = document.getElementById('back-to-top');
    if (backToTop) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        });

        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Mask initial account numbers found in the DOM (with class .mask-account)
    document.querySelectorAll('.mask-account').forEach(el => {
        el.textContent = maskAccount(el.textContent);
    });
}

/**
 * PAGINATION UTILITY
 * Fonction générique pour paginer un tableau HTML
 * @param {string} tableId - L'ID du tableau
 * @param {number} rowsPerPage - Nombre de lignes max (ex: 10)
 */
function initPagination(tableId, rowsPerPage = 10) {
    // Complex logic would go here to slice rows and add buttons
    // Provided as stub based on requirements if dynamic data was used.
    // In static HTML, you hide rows > 10.
    const table = document.getElementById(tableId);
    if (!table) return;
    
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    if (rows.length <= rowsPerPage) return; // Pas besoin de pagination
    
    // Create pagination controls below table
    // ... logic to create Next/Prev buttons and slice array ...
}

/**
 * INITIALIZE SIDEBAR TO SELECT FOR MOBILE
 * Dynamically builds a <select> mirroring the sidebar items on load.
 */
function initSidebarSelects() {
    const sidebars = document.querySelectorAll('.sidebar ul');
    sidebars.forEach(ul => {
        // Create select
        const select = document.createElement('select');
        select.className = 'mobile-section-select hidden-desktop'; // Only show on mobile
        
        // Add options based on lis
        ul.querySelectorAll('li').forEach(li => {
            const opt = document.createElement('option');
            opt.value = li.getAttribute('data-pane');
            opt.textContent = li.textContent.trim();
            if (li.classList.contains('active')) opt.selected = true;
            select.appendChild(opt);
        });

        // Event listener for select change
        select.addEventListener('change', (e) => {
            const paneId = e.target.value;
            // Find corresponding <li> and click it programmatically to reuse existing logic
            const targetLi = ul.querySelector(`li[data-pane="${paneId}"]`);
            if (targetLi) targetLi.click();
        });

        // Insert before the content area
        ul.closest('.layout-sidebar').insertBefore(select, ul.closest('.sidebar').nextSibling);
    });
}

/**
 * GLOBAL TOAST NOTIFICATION SYSTEM
 * Displays a slide-in toast from the top right (bottom on mobile).
 * @param {string} title - The title of the toast message (ex: "Virement exécuté avec succès")
 * @param {string} contentHTML - The HTML content for the body
 * @param {string} type - 'success' (default) or 'info'
 */
function showToast(title, contentHTML, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    // Create Toast Element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // HTML Structure (Icon changes based on type)
    const icon = type === 'info' 
        ? '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>'
        : '<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
    
    const iconClass = type === 'info' ? 'style="background-color:#E3F2FD;"' : '';
    const iconSvgColor = type === 'info' ? 'style="fill:#1976D2;"' : '';

    toast.innerHTML = `
        <div class="toast-header">
            <div class="toast-icon" ${iconClass}>
                <div ${iconSvgColor} style="display:flex; align-items:center; justify-content:center;">${icon}</div>
            </div>
            <div class="toast-title">${title}</div>
            <button class="toast-close" onclick="closeToast(this.parentElement.parentElement)">&times;</button>
        </div>
        <div class="toast-body">
            ${contentHTML}
        </div>
        <div class="toast-progress" style="${type === 'info' ? 'background-color:#1976D2;' : ''}"></div>
    `;

    // Add to container
    container.appendChild(toast);

    // Auto-remove after 5 seconds (matching the CSS animation)
    const timeoutId = setTimeout(() => {
        closeToast(toast);
    }, 5000); // 5000ms = 5s
    
    // Save timeout ID to element in case we close it manually
    toast.dataset.timeoutId = timeoutId;
}

/**
 * Helper to close a toast with animation
 */
function closeToast(toastEl) {
    if (!toastEl) return;
    
    // Clear the auto-remove timeout if closed manually
    if (toastEl.dataset.timeoutId) {
        clearTimeout(parseInt(toastEl.dataset.timeoutId, 10));
    }

    // Trigger exit animation
    toastEl.classList.add('toast-closing');

    // Remove from DOM after animation completes (400ms)
    setTimeout(() => {
        if (toastEl.parentNode) {
            toastEl.parentNode.removeChild(toastEl);
        }
    }, 400); // Matches the 0.4s animation duration
}

/**
 * SIMULATE VIREMENT INTERNATIONAL FOR USER DEMO
 * Hooks onto the button in index.html, extracts data, and shows the Toast.
 */
function simulateVirementIntl(btn) {
    // Prevent actual form submission or page reload
    btn.blur();
    
    // Access DOM fields (assuming user filled them, otherwise fallback)
    const form = btn.closest('form');
    let beneName = 'Non spécifié';
    let amountStr = '0.00 CFA'; // Default
    
    if (form) {
        const inputs = form.querySelectorAll('input');
        if (inputs.length > 0) beneName = inputs[0].value || 'John Doe - Demo';
        
        // Find amount input specifically
        const montantInput = document.getElementById('intl-montant');
        if (montantInput && montantInput.value) {
            amountStr = montantInput.value + ' CFA';
        }
    }

    // Generate random reference: BOA-[YEAR]-[6 DIGITS]
    const year = new Date().getFullYear();
    const randDigits = Math.floor(100000 + Math.random() * 900000); // 6-digit number
    const ref = `BOA-${year}-${randDigits}`;

    // Build the Toast body
    const bodyHtml = `
        <span>Bénéficiaire : <strong>${beneName}</strong></span>
        <span>Montant : <strong>${amountStr}</strong></span>
        <span>Référence : <strong>${ref}</strong></span>
    `;

    // Show Toast
    showToast('Virement exécuté avec succès', bodyHtml);
    
    // Optional: Reset form after success
    if (form) form.reset();
}

/**
 * SYNC DASHBOARD UI
 * Updates all balances (Accueil, Consultation, Virement) and the Donut Chart.
 */
function syncDashboardUI() {
    // Récupérer le solde depuis localStorage myboa_solde_data
    var soldeData = localStorage.getItem('myboa_solde_data');
    var soldeDynamic = soldeData ? JSON.parse(soldeData) : null;
    var soldeActuel = soldeDynamic ? soldeDynamic.solde : 1311914000;
    var deviseActuelle = soldeDynamic ? (soldeDynamic.devise_affichage || 'CFA') : 'CFA';
    var taux = { CFA:1, EUR:655.957, USD:600, GBP:750, CHF:620, CAD:450 };
    var symboles = { CFA:'CFA', EUR:'€', USD:'$', GBP:'£', CHF:'CHF', CAD:'CAD' };
    var soldeConverti = deviseActuelle === 'CFA' ? soldeActuel : soldeActuel / taux[deviseActuelle];
    var soldeFormate = Math.round(soldeConverti).toLocaleString('fr-FR') + ' ' + symboles[deviseActuelle];

    // 1. Update Virement Select
    const intlCompteDebiter = document.getElementById('intl-compte-debiter');
    if (intlCompteDebiter) {
        const currentVal = intlCompteDebiter.value;
        intlCompteDebiter.innerHTML = '<option value="">Sélectionnez un compte</option>';
        GLOBAL_ACCOUNTS.forEach(acc => {
            const opt = document.createElement('option');
            opt.value = acc.id;
            opt.textContent = `${acc.libelle} — ${acc.solde.toLocaleString('fr-FR')} ${acc.devise}`;
            intlCompteDebiter.appendChild(opt);
        });
        if (currentVal) intlCompteDebiter.value = currentVal;
    }

    // 2. Update Accueil Stats
    const cfaAcc = GLOBAL_ACCOUNTS.find(a => a.id === 'CFA');
    
    // Total Soldes (CFA)
    const totalSoldesEl = document.getElementById('stat-total-soldes');
    if (totalSoldesEl) {
        totalSoldesEl.innerHTML = `${cfaAcc.solde.toLocaleString('fr-FR')} <span class="currency">CFA</span>`;
    }

    // 3. Update "Mes Comptes" Table (Accueil)
    const tableAccueil = document.getElementById('table-mes-comptes');
    if (tableAccueil) {
        const tbody = tableAccueil.querySelector('tbody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td data-label="Compte"><span class="td-name">Compte Courant CFA - </span><span class="mask-account">0301173640002</span></td>
                    <td data-label="Devise" id="devise-compte" data-devise-label="true">${deviseActuelle}</td>
                    <td data-label="Solde Courant" id="solde-courant-compte" data-solde-cfa="${soldeActuel}">${soldeFormate}</td>
                    <td data-label="Solde Dispo" id="solde-dispo-compte" data-solde-cfa="${soldeActuel}">${soldeFormate}</td>
                </tr>
            `;
            // Re-apply masking
            tbody.querySelectorAll('.mask-account').forEach(el => {
                el.textContent = maskAccount(el.textContent);
            });
        }
    }

    // 4. Update "Consultation du solde" Table (Consultation)
    const tableConsult = document.getElementById('table-consult-solde');
    if (tableConsult) {
        const tbody = tableConsult.querySelector('tbody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td data-label="Compte"><span class="td-name">Compte Courant CFA - </span><span class="mask-account">0301173640002</span></td>
                    <td data-label="Devise" id="devise-consult" data-devise-label="true">${deviseActuelle}</td>
                    <td data-label="Solde courant" id="solde-courant-consult" data-solde-cfa="${soldeActuel}">${soldeFormate}</td>
                    <td data-label="Solde disponible" id="solde-dispo-consult" data-solde-cfa="${soldeActuel}">${soldeFormate}</td>
                </tr>
            `;
            tbody.querySelectorAll('.mask-account').forEach(el => {
                el.textContent = maskAccount(el.textContent);
            });
        }
    }

    // 5. Update Donut SVG
    updateDonutChart();

    // 6. Update History Tables
    renderAllHistoryTables();
}

/**
 * RENDER ALL HISTORY TABLES
 * Updates Accueil, Modal, and Consultation tables from global data.
 */
function renderAllHistoryTables() {
    const allOpsSorted = [...GLOBAL_TRANSACTIONS];

    // 1. Accueil (top 5)
    const tbodyRecent = document.getElementById('tbody-operations-recent');
    if (tbodyRecent) {
        tbodyRecent.innerHTML = '';
        allOpsSorted.slice(0, 5).forEach(op => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td data-label="Date">${op.dateStr}</td>
                <td data-label="Type">${op.type}</td>
                <td data-label="Description">${op.desc}</td>
                <td data-label="Montant">${op.amountStr}</td>
                <td data-label="Devise" data-devise-label="true">${op.devise}</td>
                <td data-label="Solde">${op.soldeStr}</td>
            `;
            tbodyRecent.appendChild(tr);
        });
    }

    // 2. Modal (All)
    const tbodyFull = document.getElementById('tbody-operations-full');
    if (tbodyFull) {
        tbodyFull.innerHTML = '';
        allOpsSorted.forEach(op => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td data-label="Date">${op.dateStr}</td>
                <td data-label="Type">${op.type}</td>
                <td data-label="Description">${op.desc}</td>
                <td data-label="Montant">${op.amountStr}</td>
                <td data-label="Devise" data-devise-label="true">${op.devise}</td>
                <td data-label="Solde">${op.soldeStr}</td>
            `;
            tbodyFull.appendChild(tr);
        });
    }

    // 3. Consultation (All)
    if (typeof renderConsultationTable === 'function') {
        renderConsultationTable(GLOBAL_TRANSACTIONS);
    }
}

/**
 * UPDATE DONUT CHART
 * 100% BOA Violet for the unique account.
 */
function updateDonutChart() {
    const partEur = document.getElementById('donut-part-eur');
    const partXof = document.getElementById('donut-part-xof');
    if (!partEur || !partXof) return;

    const perimeter = 2 * Math.PI * 35; 

    // Hide old parts, set to 100% and BOA Violet
    partEur.setAttribute('stroke-dasharray', `0 ${perimeter}`);
    partXof.setAttribute('stroke-dasharray', `${perimeter} 0`);
    partXof.setAttribute('stroke-dashoffset', 0);
    partXof.setAttribute('stroke', '#9A2BB2'); // Violet BOA
}

/**
 * DEBIT ACCOUNT AND START RESET TIMER
 */
function debitAccount(accountId, amount, beneName = '') {
    const account = GLOBAL_ACCOUNTS.find(a => a.id === accountId);
    if (!account) return;

    account.solde -= amount;

    // Add transaction to history
    const dateNow = new Date();
    const newOp = {
        dateStr: dateNow.toLocaleDateString('fr-FR'),
        timestamp: Date.now(),
        type: 'Virement émis',
        desc: beneName ? `Virement Intl vers ${beneName}` : 'Virement émis',
        amountRaw: -amount,
        amountStr: `<span style="color:#EF4444; font-weight:bold;" data-montant-cfa="${-amount}">-${amount.toLocaleString('fr-FR')}</span>`,
        devise: account.devise,
        soldeStr: `<span data-solde-cfa="${account.solde}">${account.solde.toLocaleString('fr-FR')} ${account.devise}</span>`,
        soldeRaw: account.solde,
        isTemporary: true
    };

    GLOBAL_TRANSACTIONS.unshift(newOp);

    syncDashboardUI();

    // Start Reset Timer (1h = 3600000ms)
    setTimeout(() => {
        resetAccount(accountId, amount);
    }, 3600000);
}

/**
 * RESET ACCOUNT BALANCE AFTER TIMER
 */
function resetAccount(accountId, amount) {
    const account = GLOBAL_ACCOUNTS.find(a => a.id === accountId);
    const original = ORIGINAL_ACCOUNTS.find(a => a.id === accountId);
    if (!account || !original) return;

    // We add back the amount
    account.solde += amount;
    
    if (Math.abs(account.solde - original.solde) < 1) {
        account.solde = original.solde;
    }

    // Remove Temporary Transactions
    GLOBAL_TRANSACTIONS = GLOBAL_TRANSACTIONS.filter(t => !t.isTemporary);

    syncDashboardUI();

    showToast('Soldes mis à jour', '<span>Vos soldes ont été actualisés automatiquement.</span>', 'info');
}

/**
 * DÉCONNEXION
 */
function logout() {
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('user');
    window.location.href = 'clientBOA/login/auth.html';
}

// Initialisation globale déconnexion
document.addEventListener('DOMContentLoaded', () => {
    const btnLogout = document.querySelector('#btn-logout, .btn-logout, [data-action="logout"], .profile-dropdown a[style*="color:red"]');
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
});
