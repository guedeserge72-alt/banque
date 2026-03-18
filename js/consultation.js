/**
 * js/consultation.js - Logique de la section Consultation
 */

document.addEventListener('DOMContentLoaded', () => {
    initConsultationSidebar();
    initConsultationHistorique();
});

/**
 * INIT CONSULTATION SIDEBAR
 */
function initConsultationSidebar() {
    const sidebarItems = document.querySelectorAll('#sidebar-consultation li');
    const contentPanes = document.querySelectorAll('#content-consultation .pane');

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

function renderConsultationTable(ops) {
    const tbody = document.getElementById('tbody-consult-historique');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (ops.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px;">Aucune opération trouvée pour cette période.</td></tr>`;
        return;
    }
    
    ops.forEach(op => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td data-label="Date">${op.dateStr}</td>
            <td data-label="Type">${op.type}</td>
            <td data-label="Description">${op.desc}</td>
            <td data-label="Montant">${op.amountStr}</td>
            <td data-label="Devise">${op.devise}</td>
            <td data-label="Solde après">${op.soldeStr}</td>
        `;
        tbody.appendChild(tr);
    });
}

function initConsultationHistorique() {
    // Initial Render
    if (typeof GLOBAL_TRANSACTIONS_XOF !== 'undefined') {
        renderConsultationTable(GLOBAL_TRANSACTIONS_XOF);
    }
    
    const btnFilter = document.getElementById('btn-filter-hist');
    const inputStart = document.getElementById('hist-date-debut');
    const inputEnd = document.getElementById('hist-date-fin');
    
    if (btnFilter && inputStart && inputEnd) {
        btnFilter.addEventListener('click', () => {
            const startVal = inputStart.value;
            const endVal = inputEnd.value;
            
            let filteredOps = GLOBAL_TRANSACTIONS_XOF;
            
            if (startVal) {
                const startTime = new Date(startVal + 'T00:00:00').getTime();
                filteredOps = filteredOps.filter(op => op.timestamp >= startTime);
            }
            if (endVal) {
                // Set end time to end of day
                const endTime = new Date(endVal + 'T23:59:59').getTime();
                filteredOps = filteredOps.filter(op => op.timestamp <= endTime);
            }
            
            renderConsultationTable(filteredOps);
        });
    }
}
