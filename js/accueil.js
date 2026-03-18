/**
 * js/accueil.js - Logique de la page d'accueil
 */

document.addEventListener('DOMContentLoaded', () => {
    initQuickActions();
    initOperationsAccueil();
});

/**
 * INITIALIZE QUICK ACTIONS
 */
function initQuickActions() {
    const btnTransferts = document.getElementById('btn-quick-transferts');
    
    if (btnTransferts) {
        btnTransferts.addEventListener('click', () => {
            const menuVire = document.querySelector('.nav-item[data-target="section-virements"]');
            if(menuVire) menuVire.click();
        });
    }
}

function initOperationsAccueil() {
    const btnOpen = document.getElementById('btn-quick-operations');
    const modal = document.getElementById('modal-operations');
    
    if (btnOpen && modal) {
        btnOpen.addEventListener('click', () => {
            modal.style.display = 'flex';
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden'; // Empêcher le scroll
        });
    }

    // ================================================
    // CORRECTION — FERMETURE MODALE
    // ================================================
    
    // Fermer la modale au clic sur X
    document.querySelectorAll('.modal-close, .close-modal, [data-dismiss="modal"], #close-historique, .modal-header .close, #btn-close-operations').forEach(function(btn) {
        btn.addEventListener('click', function() {
            // Fermer toutes les modales
            document.querySelectorAll('.modal, .modal-overlay, #modal-historique, #modal-operations, [class*="modal"]').forEach(function(modal) {
                modal.style.display = 'none';
                modal.classList.add('hidden');
                modal.classList.remove('show', 'active', 'open');
            });
            // Restaurer le scroll
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        });
    });

    // Fermer en cliquant en dehors de la modale
    document.querySelectorAll('.modal, .modal-overlay, #modal-operations').forEach(function(overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
                this.classList.add('hidden');
                this.classList.remove('show', 'active', 'open');
                document.body.style.overflow = '';
            }
        });
    });

    // Fermer avec la touche Echap
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal, .modal-overlay, #modal-historique, #modal-operations').forEach(function(modal) {
                modal.style.display = 'none';
                modal.classList.add('hidden');
                modal.classList.remove('show', 'active', 'open');
            });
            document.body.style.overflow = '';
        }
    });
}
