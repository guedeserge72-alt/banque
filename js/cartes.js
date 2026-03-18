/**
 * js/cartes.js - Logique de la section Cartes
 */

document.addEventListener('DOMContentLoaded', () => {
    initCartesSidebar();
    initCreditCardInteractions();
    renderCartesOperations();
});

function initCartesSidebar() {
    const sidebarItems = document.querySelectorAll('#sidebar-cartes li');
    const contentPanes = document.querySelectorAll('#content-cartes .pane');

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

function initCreditCardInteractions() {
    const ccMock = document.getElementById('mock-card-1');
    const ccDetails = document.getElementById('carte-details');
    const ccMenuBtn = document.getElementById('btn-cc-menu');
    const ccDropdown = document.getElementById('dropdown-cc');

    if (ccMock && ccDetails) {
        ccMock.addEventListener('click', (e) => {
            // Prevent opening details if clicking the dots menu
            if (e.target === ccMenuBtn || ccDropdown.contains(e.target)) return;
            ccDetails.classList.toggle('hidden');
        });
    }

    if (ccMenuBtn && ccDropdown) {
        ccMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            ccDropdown.classList.toggle('show');
        });
    }

    // Close 3-dots dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (ccDropdown && ccDropdown.classList.contains('show') && e.target !== ccMenuBtn) {
            ccDropdown.classList.remove('show');
        }
    });
}

/**
 * GENERATE REALISTIC CARD TRANSACTIONS 2005 - 2012
 */
function generateCartesOperations() {
    // We aim to have a variety of realistic expenses over the 2005-2012 period.
    // The sum should be a reasonable portion (e.g. 50,000 to 800,000 CFA in total, definitely < 2M CFA or 1.3B CFA).
    const ops = [
        { date: '12/03/2005', op: 'Retrait GAB - Agence Centrale', amount: 50000 },
        { date: '04/05/2005', op: 'Paiement Supermarché', amount: 35000 },
        { date: '18/08/2006', op: 'Paiement Restaurant Le Relais', amount: 45000 },
        { date: '22/11/2006', op: 'Achat en ligne - Billets avion', amount: 150000 },
        { date: '09/02/2007', op: 'Paiement Hôtel Résidence', amount: 85000 },
        { date: '15/07/2007', op: 'Retrait GAB', amount: 20000 },
        { date: '30/10/2008', op: 'Achat carburant - Station Service', amount: 30000 },
        { date: '11/04/2009', op: 'Paiement Supermarché', amount: 55000 },
        { date: '23/09/2009', op: 'Achat en ligne - Matériel', amount: 120000 },
        { date: '05/01/2010', op: 'Paiement Boutique Vêtements', amount: 48000 },
        { date: '19/06/2010', op: 'Retrait GAB', amount: 100000 },
        { date: '02/11/2011', op: 'Paiement Restaurant', amount: 32000 },
        { date: '14/03/2012', op: 'Paiement Hôtel', amount: 95000 },
        { date: '28/08/2012', op: 'Achat carburant', amount: 25000 },
        { date: '15/12/2012', op: 'Achat en ligne - Cadeaux', amount: 110000 }
    ];
    
    // Sort descending by putting newest at top (if parsed), 
    // but the array is chronologically asc right now, so we reverse it.
    ops.reverse();
    
    return ops;
}

function renderCartesOperations() {
    const tbody = document.getElementById('tbody-cartes-ops');
    if (!tbody) return;
    
    const ops = generateCartesOperations();
    tbody.innerHTML = '';
    
    ops.forEach(t => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td data-label="Date">${t.date}</td>
            <td data-label="Opération">${t.op}</td>
            <td data-label="Montant" style="color:#EF4444; font-weight:bold;">- ${t.amount.toLocaleString('fr-FR')} CFA</td>
        `;
        tbody.appendChild(tr);
    });
}
