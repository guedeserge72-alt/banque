/**
 * js/clavier.js - Clavier virtuel sécurisé
 */

class SecureKeypad {
    /**
     * @param {string} containerId - ID du div contenant les boutons
     * @param {string} inputId - ID de l'input texte ciblé
     */
    constructor(containerId, inputId) {
        this.container = document.getElementById(containerId);
        this.input = document.getElementById(inputId);
        this.digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

        if (this.container && this.input) {
            this.init();
        }
    }

    /**
     * INITIALIZE KEYPAD
     * Mélange initial et attache les événements
     */
    init() {
        // Shuffle on open if there is a trigger
        this.input.addEventListener('focus', () => {
            this.shuffleKeys();
            this.container.classList.remove('hidden');
        });

        // Crée les 10 boutons (plus éventuellement 2 vides pour forcer un layout 3x4)
        this.renderKeys();
    }

    /**
     * RENDER KEYS
     * Construit le DOM interne du clavier
     */
    renderKeys() {
        this.container.innerHTML = '';
        
        // On mélange avant le rendu
        const shuffled = this.shuffleArray([...this.digits]);
        
        shuffled.forEach(digit => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'keypad-btn';
            btn.textContent = digit;
            
            // Gestion du clic & touch
            btn.addEventListener('click', (e) => this.handleKeyPress(e, digit));
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault(); // Eviter click ghost
                this.handleKeyPress(e, digit);
            });
            
            this.container.appendChild(btn);
        });

        // Ajout d'un bouton "Effacer"
        const btnClear = document.createElement('button');
        btnClear.type = 'button';
        btnClear.className = 'keypad-btn';
        btnClear.innerHTML = '&larr;'; // Flèche retour
        btnClear.style.gridColumn = 'span 2'; // Prend plus de place
        btnClear.addEventListener('click', (e) => this.handleClear(e));
        btnClear.addEventListener('touchstart', (e) => { e.preventDefault(); this.handleClear(e); });
        this.container.appendChild(btnClear);
    }

    /**
     * HANDLE KEYPRESS
     * Ajoute le chiffre à l'input et MÉLANGE à nouveau le clavier
     * @param {Event} e 
     * @param {string} digit 
     */
    handleKeyPress(e, digit) {
        if (this.input.value.length < 8) { // Max length par exemple
            this.input.value += digit;
            
            // LA REGLE : Mélanger à CHAQUE touche pressée
            this.renderKeys(); 
        }
    }

    /**
     * HANDLE CLEAR
     * Supprime le dernier chiffre
     */
    handleClear(e) {
        this.input.value = this.input.value.slice(0, -1);
    }

    /**
     * SHUFFLE ARRAY
     * Algorithme de Fisher-Yates
     * @param {Array} array 
     * @returns {Array} Shuffled array
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    /**
     * SHUFFLE KEYS EXTERNALS
     * Utile si on veut forcer le mélange depuis un autre fichier
     */
    shuffleKeys() {
        this.renderKeys();
    }
}

// Initialisé globalement si on le trouve (exemple page Virements > signature)
document.addEventListener('DOMContentLoaded', () => {
    // S'il y a un clavier avec l'ID "global-keypad" pour un "#pin-input"
    new SecureKeypad('global-keypad', 'pin-input');
});
