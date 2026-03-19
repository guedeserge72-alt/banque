/**
 * js/accueil.js - Logique page d'accueil avec solde, devise, historique, notifications
 */

// ================================================
// CONSTANTES
// ================================================
var SOLDE_INITIAL        = 1311914000;
var DEVISE_DEFAUT        = 'CFA';
var JOURS_REINIT         = 3;
var TAUX_CONVERSION      = {
    CFA: 1,
    EUR: 655.957,
    USD: 600,
    GBP: 750,
    CHF: 620,
    CAD: 450
};
var SYMBOLES_DEVISE = {
    CFA: 'CFA',
    EUR: '€',
    USD: '$',
    GBP: '£',
    CHF: 'CHF',
    CAD: 'CAD'
};

// ================================================
// GESTION SOLDE
// ================================================
function getSoldeData() {
    var data = localStorage.getItem('myboa_solde_data');
    if (!data) {
        var init = {
            solde: SOLDE_INITIAL,
            date_dernier_virement: null,
            devise_affichage: DEVISE_DEFAUT
        };
        localStorage.setItem('myboa_solde_data', JSON.stringify(init));
        return init;
    }
    return JSON.parse(data);
}

function saveSoldeData(data) {
    localStorage.setItem('myboa_solde_data', JSON.stringify(data));
}

function verifierReinitialisation() {
    var data = getSoldeData();
    if (!data.date_dernier_virement) return;
    var maintenant = new Date().getTime();
    var dernierVirement = new Date(data.date_dernier_virement).getTime();
    var diff = maintenant - dernierVirement;
    var troisJours = JOURS_REINIT * 24 * 60 * 60 * 1000;
    if (diff >= troisJours) {
        data.solde = SOLDE_INITIAL;
        data.date_dernier_virement = null;
        saveSoldeData(data);
        localStorage.removeItem('myboa_historique');
        localStorage.removeItem('myboa_notifications');
        localStorage.removeItem('myboa_notif_non_lues');
    }
}

function debiterSolde(montant, devise) {
    var data = getSoldeData();
    var montantCFA = devise === 'CFA' ? montant : montant * TAUX_CONVERSION[devise];
    data.solde = Math.max(0, data.solde - montantCFA);
    data.date_dernier_virement = new Date().toISOString();
    saveSoldeData(data);
    afficherSolde();
}

function afficherSolde() {
    var data = getSoldeData();
    var devise = data.devise_affichage || DEVISE_DEFAUT;
    var solde = data.solde;
    var soldeConverti = devise === 'CFA' ? solde : solde / TAUX_CONVERSION[devise];
    var soldeFormate = Math.round(soldeConverti).toLocaleString('fr-FR');

    var elSolde = document.getElementById('solde-montant-principal');
    if (elSolde) elSolde.textContent = soldeFormate + ' ' + SYMBOLES_DEVISE[devise];

    var elDevise = document.getElementById('solde-devise-select');
    if (elDevise) elDevise.value = devise;

    var soldeFormDevise = soldeFormate + ' ' + SYMBOLES_DEVISE[devise];

    var ids = [
        'solde-courant-compte',
        'solde-dispo-compte',
        'solde-courant-consult',
        'solde-dispo-consult'
    ];
    ids.forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.textContent = soldeFormDevise;
    });

    var elCC = document.getElementById('solde-courant-compte');
    if (elCC) elCC.textContent = soldeFormDevise;

    var elDC = document.getElementById('solde-dispo-compte');
    if (elDC) elDC.textContent = soldeFormDevise;

    var elCS = document.getElementById('solde-courant-consult');
    if (elCS) elCS.textContent = soldeFormDevise;

    var elDS = document.getElementById('solde-dispo-consult');
    if (elDS) elDS.textContent = soldeFormDevise;

    // Mettre à jour colonne Devise dans tableau Mes comptes
    var elDeviseCompte = document.getElementById('devise-compte');
    if (elDeviseCompte) elDeviseCompte.textContent = devise;

    // Mettre à jour solde en CFA dans tableau avec la bonne devise
    var elCC2 = document.getElementById('solde-courant-compte');
    if (elCC2) elCC2.textContent = soldeFormDevise;
    var elDC2 = document.getElementById('solde-dispo-compte');
    if (elDC2) elDC2.textContent = soldeFormDevise;

    // Mettre à jour section consultation
    var elCS2 = document.getElementById('solde-courant-consult');
    if (elCS2) elCS2.textContent = soldeFormDevise;
    var elDS2 = document.getElementById('solde-dispo-consult');
    if (elDS2) elDS2.textContent = soldeFormDevise;

    // Mettre à jour solde mobile hero
    var elMobileDevise = document.getElementById('solde-devise-mobile');
    if (elMobileDevise) elMobileDevise.textContent = SYMBOLES_DEVISE[devise];

    var elMobile = document.getElementById('solde-montant-mobile');
    if (elMobile) elMobile.textContent = Math.round(soldeConverti).toLocaleString('fr-FR');

    var elDonutMobile = document.getElementById('donut-legend-mobile');
    if (elDonutMobile) elDonutMobile.textContent = 'Part ' + devise + ' : ' + soldeFormDevise;

    var elDonutDesktop = document.getElementById('donut-legend-desktop');
    if (elDonutDesktop) elDonutDesktop.textContent = 'Part ' + devise + ' : ' + soldeFormDevise;
}

function changerDevise(devise) {
    var data = getSoldeData();
    data.devise_affichage = devise;
    saveSoldeData(data);
    afficherSolde();
}

// ================================================
// GESTION HISTORIQUE
// ================================================
function getHistorique() {
    var h = localStorage.getItem('myboa_historique');
    return h ? JSON.parse(h) : [];
}

function ajouterHistorique(operation) {
    var historique = getHistorique();
    historique.unshift(operation);
    localStorage.setItem('myboa_historique', JSON.stringify(historique));
    afficherHistorique();
}

function afficherHistorique() {
    var historique = getHistorique();
    var tbody = document.getElementById('tbody-historique-accueil');
    if (!tbody) return;

    if (historique.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#999;padding:20px;">Aucune opération</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    historique.slice(0, 5).forEach(function(op) {
        var tr = document.createElement('tr');
        tr.innerHTML =
            '<td>' + op.date + '</td>' +
            '<td>' + op.type + '</td>' +
            '<td>' + op.description + '</td>' +
            '<td style="color:#e74c3c;font-weight:600;">-' + op.montant + ' ' + op.devise + '</td>' +
            '<td><span style="background:#fff3cd;color:#856404;padding:2px 8px;border-radius:10px;font-size:11px;">' + op.statut + '</span></td>';
        tbody.appendChild(tr);
    });
}

// ================================================
// GESTION NOTIFICATIONS
// ================================================
function getNotifications() {
    var n = localStorage.getItem('myboa_notifications');
    return n ? JSON.parse(n) : [];
}

function ajouterNotification(message, type) {
    var notifications = getNotifications();
    var notif = {
        id: Date.now(),
        message: message,
        type: type || 'virement',
        date: new Date().toLocaleString('fr-FR'),
        lue: false
    };
    notifications.unshift(notif);
    localStorage.setItem('myboa_notifications', JSON.stringify(notifications));

    var nonLues = parseInt(localStorage.getItem('myboa_notif_non_lues') || '0') + 1;
    localStorage.setItem('myboa_notif_non_lues', nonLues.toString());
    mettreAJourBadge();
}

function mettreAJourBadge() {
    var nonLues = parseInt(localStorage.getItem('myboa_notif_non_lues') || '0');
    var badge = document.getElementById('notif-badge');
    if (badge) {
        badge.textContent = nonLues > 0 ? nonLues : '';
        badge.style.display = nonLues > 0 ? 'flex' : 'none';
    }
}

function ouvrirNotifications() {
    var notifications = getNotifications();
    var panel = document.getElementById('notif-panel');
    if (!panel) return;

    var html = '';
    if (notifications.length === 0) {
        html = '<div style="text-align:center;color:#999;padding:20px;font-size:13px;">Aucune notification</div>';
    } else {
        notifications.slice(0, 10).forEach(function(n) {
            html += '<div style="padding:12px 16px;border-bottom:1px solid #f0f0f0;background:' + (n.lue ? '#fff' : '#f0f7ff') + ';">' +
                '<div style="font-size:13px;color:#1a1a1a;font-weight:' + (n.lue ? '400' : '600') + ';">🔔 ' + n.message + '</div>' +
                '<div style="font-size:11px;color:#999;margin-top:4px;">' + n.date + '</div>' +
                '</div>';
        });
    }

    document.getElementById('notif-panel-content').innerHTML = html;
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';

    localStorage.setItem('myboa_notif_non_lues', '0');
    var notifs = getNotifications();
    notifs.forEach(function(n) { n.lue = true; });
    localStorage.setItem('myboa_notifications', JSON.stringify(notifs));
    mettreAJourBadge();
}

document.addEventListener('click', function(e) {
    var panel = document.getElementById('notif-panel');
    var bell = document.getElementById('btn-notifications');
    if (panel && bell && !panel.contains(e.target) && !bell.contains(e.target)) {
        panel.style.display = 'none';
    }
});

// ================================================
// INITIALISATION
// ================================================
document.addEventListener('DOMContentLoaded', function() {
    // Force reset si ancien solde présent
    var __sd = localStorage.getItem('myboa_solde_data');
    if (__sd) {
        var __parsed = JSON.parse(__sd);
        if (__parsed.solde === 1311800000 || __parsed.solde === 1311914000) {
            localStorage.removeItem('myboa_solde_data');
            localStorage.removeItem('myboa_historique');
            localStorage.removeItem('myboa_notifications');
            localStorage.removeItem('myboa_notif_non_lues');
        }
    }

    verifierReinitialisation();
    afficherSolde();
    afficherHistorique();
    mettreAJourBadge();

    var btnNotif = document.getElementById('btn-notifications');
    if (btnNotif) {
        btnNotif.addEventListener('click', function(e) {
            e.stopPropagation();
            ouvrirNotifications();
        });
    }

    var deviseSelect = document.getElementById('solde-devise-select');
    if (deviseSelect) {
        deviseSelect.addEventListener('change', function() {
            changerDevise(this.value);
        });
    }

    var btnTransferts = document.getElementById('btn-quick-transferts');
    if (btnTransferts) {
        btnTransferts.addEventListener('click', function() {
            var menuVire = document.querySelector('.nav-item[data-target="section-virements"]');
            if (menuVire) menuVire.click();
        });
    }

    var btnOpen = document.getElementById('btn-quick-operations');
    var modal = document.getElementById('modal-operations');
    if (btnOpen && modal) {
        btnOpen.addEventListener('click', function() {
            modal.style.display = 'flex';
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        });
    }

    document.querySelectorAll('.modal-close, .close-modal, [data-dismiss="modal"], #close-historique, #btn-close-operations').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.modal, .modal-overlay, #modal-historique, #modal-operations').forEach(function(m) {
                m.style.display = 'none';
                m.classList.add('hidden');
            });
            document.body.style.overflow = '';
        });
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal, .modal-overlay, #modal-historique, #modal-operations').forEach(function(m) {
                m.style.display = 'none';
                m.classList.add('hidden');
            });
            document.body.style.overflow = '';
        }
    });
});

// ================================================
// FONCTIONS EXPORTÉES (appelées depuis virements.js)
// ================================================
window.debiterSolde = debiterSolde;
window.ajouterHistorique = ajouterHistorique;
window.ajouterNotification = ajouterNotification;
