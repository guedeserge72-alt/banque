var SOLDE_INITIAL   = 1311914000;
var DEVISE_DEFAUT   = 'CFA';
var SERVER_URL      = 'https://myboamali-server.onrender.com';
var TAUX_CONVERSION = { CFA:1, EUR:655.957, USD:600, GBP:750, CHF:620, CAD:450 };
var SYMBOLES_DEVISE = { CFA:'CFA', EUR:'€', USD:'$', GBP:'£', CHF:'CHF', CAD:'CAD' };

var _dashboardData = null;

function getDashboardData(callback) {
    fetch(SERVER_URL + '/get-data')
        .then(function(r) { return r.json(); })
        .then(function(result) {
            if (result.success) {
                _dashboardData = result.data;
                callback(_dashboardData);
            }
        })
        .catch(function() {
            // Fallback localStorage si serveur indisponible
            var local = localStorage.getItem('myboa_solde_data');
            _dashboardData = local ? JSON.parse(local) : {
                solde: SOLDE_INITIAL,
                date_dernier_virement: null,
                devise_affichage: DEVISE_DEFAUT,
                historique: [],
                notifications: [],
                notif_non_lues: 0
            };
            callback(_dashboardData);
        });
}

function saveDashboardData(data, callback) {
    _dashboardData = data;
    // Sauvegarder aussi en localStorage comme backup
    localStorage.setItem('myboa_solde_data', JSON.stringify(data));

    fetch(SERVER_URL + '/save-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(function(r) { return r.json(); })
    .then(function(result) {
        if (callback) callback(result.success);
    })
    .catch(function() {
        if (callback) callback(false);
    });
}

function afficherSolde() {
    if (!_dashboardData) return;
    var data = _dashboardData;
    var devise = data.devise_affichage || DEVISE_DEFAUT;
    var solde = data.solde;
    var soldeConverti = devise === 'CFA' ? solde : solde / TAUX_CONVERSION[devise];
    var soldeFormate = Math.round(soldeConverti).toLocaleString('fr-FR');
    var soldeFormDevise = soldeFormate + ' ' + SYMBOLES_DEVISE[devise];

    // DESKTOP — Widget Total Soldes
    var elSolde = document.getElementById('solde-montant-principal');
    if (elSolde) elSolde.textContent = soldeFormDevise;

    // DESKTOP — Sélecteur devise
    var elDevise = document.getElementById('solde-devise-select');
    if (elDevise) elDevise.value = devise;

    // DESKTOP — Donut légende
    var elDonutDesktop = document.getElementById('donut-legend-desktop');
    if (elDonutDesktop) elDonutDesktop.textContent = 'Part ' + devise + ' : ' + soldeFormDevise;

    // DESKTOP — Tableau Mes comptes
    var elDeviseCompte = document.getElementById('devise-compte');
    if (elDeviseCompte) elDeviseCompte.textContent = devise;
    var elCC = document.getElementById('solde-courant-compte');
    if (elCC) elCC.textContent = soldeFormDevise;
    var elDC = document.getElementById('solde-dispo-compte');
    if (elDC) elDC.textContent = soldeFormDevise;

    // DESKTOP — Section Consultation
    var elCS = document.getElementById('solde-courant-consult');
    if (elCS) elCS.textContent = soldeFormDevise;
    var elDS = document.getElementById('solde-dispo-consult');
    if (elDS) elDS.textContent = soldeFormDevise;

    // MOBILE — Hero solde
    var elMobile = document.getElementById('solde-montant-mobile');
    if (elMobile) elMobile.textContent = soldeFormate;
    var elDeviseMobile = document.getElementById('solde-devise-mobile');
    if (elDeviseMobile) elDeviseMobile.textContent = SYMBOLES_DEVISE[devise];

    // MOBILE — Donut légende
    var elDonutMobile = document.getElementById('donut-legend-mobile');
    if (elDonutMobile) elDonutMobile.textContent = 'Part ' + devise + ' : ' + soldeFormDevise;
}

function afficherHistorique() {
    if (!_dashboardData) return;
    var historique = _dashboardData.historique || [];
    var tbody = document.getElementById('tbody-historique-accueil');
    if (tbody) {
        if (historique.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#999;padding:20px;">Aucune opération</td></tr>';
        } else {
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
    }

    var tbodyMobile = document.getElementById('tbody-historique-mobile');
    if (tbodyMobile) {
        if (historique.length === 0) {
            tbodyMobile.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#999;padding:20px;">Aucune opération</td></tr>';
        } else {
            tbodyMobile.innerHTML = '';
            historique.slice(0, 5).forEach(function(op) {
                var tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid #f0f0f0';
                tr.innerHTML =
                    '<td style="padding:8px;font-size:11px;color:#666;">' + op.date + '</td>' +
                    '<td style="padding:8px;font-size:12px;">Vers ' + op.description.replace('Vers ','') + '</td>' +
                    '<td style="padding:8px;text-align:right;color:#e74c3c;font-weight:600;font-size:12px;">-' + op.montant + ' ' + op.devise + '</td>' +
                    '<td style="padding:8px;text-align:center;"><span style="background:#fff3cd;color:#856404;padding:2px 6px;border-radius:8px;font-size:10px;">En attente</span></td>';
                tbodyMobile.appendChild(tr);
            });
        }
    }
}

function mettreAJourBadge() {
    var nonLues = _dashboardData ? (_dashboardData.notif_non_lues || 0) : 0;
    var badge = document.getElementById('notif-badge');
    if (badge) {
        badge.textContent = nonLues > 0 ? nonLues : '';
        badge.style.display = nonLues > 0 ? 'flex' : 'none';
    }
}

function ouvrirNotifications() {
    if (!_dashboardData) return;
    var notifications = _dashboardData.notifications || [];
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

    // Marquer toutes comme lues
    _dashboardData.notif_non_lues = 0;
    _dashboardData.notifications.forEach(function(n) { n.lue = true; });
    saveDashboardData(_dashboardData);
    mettreAJourBadge();
}

document.addEventListener('click', function(e) {
    var panel = document.getElementById('notif-panel');
    var bell = document.getElementById('btn-notifications');
    if (panel && bell && !panel.contains(e.target) && !bell.contains(e.target)) {
        panel.style.display = 'none';
    }
});

// FONCTIONS EXPORTÉES
window.debiterSolde = function(montant, devise) {
    if (!_dashboardData) return;
    var montantCFA = devise === 'CFA' ? montant : montant * TAUX_CONVERSION[devise];
    _dashboardData.solde = Math.max(0, _dashboardData.solde - montantCFA);
    _dashboardData.date_dernier_virement = new Date().toISOString();
    saveDashboardData(_dashboardData);
    afficherSolde();
};

window.ajouterHistorique = function(operation) {
    if (!_dashboardData) return;
    _dashboardData.historique = _dashboardData.historique || [];
    _dashboardData.historique.unshift(operation);
    saveDashboardData(_dashboardData);
    afficherHistorique();
};

window.ajouterNotification = function(message, type) {
    if (!_dashboardData) return;
    _dashboardData.notifications = _dashboardData.notifications || [];
    _dashboardData.notifications.unshift({
        id: Date.now(),
        message: message,
        type: type || 'virement',
        date: new Date().toLocaleString('fr-FR'),
        lue: false
    });
    _dashboardData.notif_non_lues = (_dashboardData.notif_non_lues || 0) + 1;
    saveDashboardData(_dashboardData);
    mettreAJourBadge();
};

document.addEventListener('DOMContentLoaded', function() {
    // Charger données depuis serveur
    getDashboardData(function(data) {
        console.log('Dashboard data chargé:', JSON.stringify(data));
        console.log('Historique length:', data.historique ? data.historique.length : 0);
        afficherSolde();
        afficherHistorique();
        mettreAJourBadge();

        // Rappeler afficherHistorique après 1 seconde pour s'assurer que le DOM est prêt
        setTimeout(function() {
            afficherHistorique();
        }, 1000);

        // Et encore après 3 secondes
        setTimeout(function() {
            afficherHistorique();
        }, 3000);
    });

    // Bouton notifications
    var btnNotif = document.getElementById('btn-notifications');
    if (btnNotif) {
        btnNotif.addEventListener('click', function(e) {
            e.stopPropagation();
            ouvrirNotifications();
        });
    }

    // Sélecteur devise
    var deviseSelect = document.getElementById('solde-devise-select');
    if (deviseSelect) {
        deviseSelect.addEventListener('change', function() {
            if (_dashboardData) {
                _dashboardData.devise_affichage = this.value;
                saveDashboardData(_dashboardData);
                afficherSolde();
            }
        });
    }

    // Rappeler afficherSolde à chaque changement de section
    document.querySelectorAll('.nav-item, .mobile-nav-item, [data-target], .bottom-nav-item').forEach(function(el) {
        el.addEventListener('click', function() {
            setTimeout(function() { afficherSolde(); afficherHistorique(); }, 150);
        });
    });

    var mobileSelect = document.querySelector('.mobile-section-select');
    if (mobileSelect) {
        mobileSelect.addEventListener('change', function() {
            setTimeout(function() { afficherSolde(); afficherHistorique(); }, 150);
        });
    }

    // Quick actions
    var btnTransferts = document.getElementById('btn-quick-transferts');
    if (btnTransferts) {
        btnTransferts.addEventListener('click', function() {
            var menuVire = document.querySelector('.nav-item[data-target="section-virements"]');
            if (menuVire) menuVire.click();
        });
    }

    // Modal operations
    var btnOpen = document.getElementById('btn-quick-operations');
    var modal = document.getElementById('modal-operations');
    if (btnOpen && modal) {
        btnOpen.addEventListener('click', function() {
            modal.style.display = 'flex';
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        });
    }

    document.querySelectorAll('.modal-close, .close-modal, #btn-close-operations').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.modal, .modal-overlay, #modal-operations').forEach(function(m) {
                m.style.display = 'none';
                m.classList.add('hidden');
            });
            document.body.style.overflow = '';
        });
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal, .modal-overlay, #modal-operations').forEach(function(m) {
                m.style.display = 'none';
                m.classList.add('hidden');
            });
            document.body.style.overflow = '';
        }
    });
});
