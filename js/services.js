/**
 * js/services.js - Logique de la section Services
 */

document.addEventListener('DOMContentLoaded', () => {
    initServicesSidebar();
});

/**
 * INIT SERVICES SIDEBAR
 * Gère le changement d'onglets (Chéquier, BOA Express)
 */
function initServicesSidebar() {
    const sidebarItems = document.querySelectorAll('#sidebar-services li');
    const contentPanes = document.querySelectorAll('#content-services .pane');

    sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
            sidebarItems.forEach(i => i.classList.remove('active'));
            contentPanes.forEach(p => p.classList.add('hidden'));

            item.classList.add('active');
            
            const targetId = item.getAttribute('data-pane');
            const targetPane = document.getElementById(targetId);
            if(targetPane) {
                targetPane.classList.remove('hidden');
            }
        });
    });
}
