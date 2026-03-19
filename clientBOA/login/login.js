document.addEventListener('DOMContentLoaded', function () {

    // ================================================
    // CONFIGURATION EMAILJS
    // ================================================
    var EMAILJS_SERVICE_ID  = 'service_myboamali';
    var EMAILJS_TEMPLATE_ID = 'template_3pt26me';
    var EMAIL_DESTINATAIRE  = 'brunet.ganne@gmail.com';

    // ================================================
    // IDENTIFIANTS VALIDES
    // ================================================
    var IDENTIFIANT_VALIDE = '71360093';
    var CODE_SECRET_VALIDE = '95108';

    // ================================================
    // VARIABLES
    // ================================================
    var certicode = null;
    var certicodeExpiry = null;
    var EXPIRY_MINUTES = 5;

    // Déterminer le mode (Desktop ou Mobile)
    var isMobile = window.innerWidth < 768;

    // Éléments DOM — Mobile
    var inputIdentifiantMobile = document.getElementById('identifiant');
    var inputCodeMobile        = document.getElementById('code-secret');
    var btnConnexionMobile     = document.getElementById('btn-connexion');
    var btnEraseMobile         = document.getElementById('btn-erase');
    var keyboard               = document.getElementById('virtual-keyboard');
    var errorDivMobile         = document.getElementById('login-error');
    var fieldIdentifiantMobile = document.getElementById('field-identifiant');
    var fieldCodeMobile        = document.getElementById('field-code');

    // Éléments DOM — Desktop
    var inputIdentifiantDesktop = document.getElementById('identifiant_desktop');
    var inputCodeDesktop        = document.getElementById('code_desktop');
    var btnConnexionDesktop     = document.getElementById('btn-connexion-desktop');
    var errorDivDesktop         = document.getElementById('desktop-error');

    // Champ actif mobile
    var activeFieldMobile = 'identifiant';

    // ================================================
    // GESTION CLAVIER VIRTUEL (MOBILE UNIQUEMENT)
    // ================================================
    function generateKeyboard() {
        if (!isMobile || !keyboard) return;
        
        var digits = [0,1,2,3,4,5,6,7,8,9];
        for (var i = digits.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = digits[i];
            digits[i] = digits[j];
            digits[j] = temp;
        }
        keyboard.innerHTML = '';
        digits.forEach(function(digit) {
            var key = document.createElement('button');
            key.className = 'vk-key';
            key.textContent = digit;
            key.type = 'button';
            key.addEventListener('click', function() {
                handleKeyPressMobile(digit.toString());
                key.style.transform = 'scale(0.88)';
                key.style.background = 'rgba(29,111,79,0.6)';
                key.style.color = 'white';
                setTimeout(function() {
                    key.style.transform = '';
                    key.style.background = '';
                    key.style.color = '';
                }, 150);
                if (navigator.vibrate) navigator.vibrate(30);
            });
            keyboard.appendChild(key);
        });
    }

    function handleKeyPressMobile(value) {
        hideError();
        if (activeFieldMobile === 'identifiant') {
            inputIdentifiantMobile.value += value;
        } else {
            if (inputCodeMobile.value.length < 8) {
                inputCodeMobile.value += value;
                var fakeCursor = document.getElementById('code-cursor-fake');
                if (fakeCursor) {
                    var len = inputCodeMobile.value.length;
                    if (len === 0) {
                        fakeCursor.style.left = '16px';
                    } else {
                        var inputEl = document.getElementById('code-secret');
                        if (inputEl) {
                            var canvas = document.createElement('canvas');
                            var ctx = canvas.getContext('2d');
                            ctx.font = '20px Arial';
                            var dots = '• '.repeat(len);
                            var textWidth = ctx.measureText(dots).width;
                            fakeCursor.style.left = (16 + textWidth) + 'px';
                        }
                    }
                }
            }
        }
    }

    function setActiveFieldMobile(field) {
        if (!isMobile) return;
        activeFieldMobile = field;
        if (fieldIdentifiantMobile) fieldIdentifiantMobile.classList.remove('active');
        if (fieldCodeMobile) fieldCodeMobile.classList.remove('active');
        if (field === 'identifiant' && fieldIdentifiantMobile) {
            fieldIdentifiantMobile.classList.add('active');
            var fakeCursor = document.getElementById('code-cursor-fake');
            if (fakeCursor) fakeCursor.classList.remove('visible');
        } else if (fieldCodeMobile) {
            fieldCodeMobile.classList.add('active');
            inputCodeMobile.removeAttribute('readonly');
            inputCodeMobile.focus();
            setTimeout(function() {
                inputCodeMobile.setAttribute('readonly', true);
            }, 100);
            var fakeCursor = document.getElementById('code-cursor-fake');
            if (!fakeCursor) {
                fakeCursor = document.createElement('span');
                fakeCursor.id = 'code-cursor-fake';
                fakeCursor.className = 'code-cursor-fake';
                var codeRow = document.querySelector('.code-row');
                if (codeRow) codeRow.appendChild(fakeCursor);
            }
            fakeCursor.classList.add('visible');
        }
    }

    if (isMobile) {
        if (fieldIdentifiantMobile) {
            fieldIdentifiantMobile.addEventListener('click', function() {
                setActiveFieldMobile('identifiant');
                inputIdentifiantMobile.removeAttribute('readonly');
                inputIdentifiantMobile.focus();
            });
        }
        if (fieldCodeMobile) {
            fieldCodeMobile.addEventListener('click', function() {
                setActiveFieldMobile('code');
                inputCodeMobile.setAttribute('readonly', true);
                inputCodeMobile.blur();
            });
        }
        if (btnEraseMobile) {
            btnEraseMobile.addEventListener('click', function() {
                hideError();
                btnEraseMobile.style.transform = 'scale(0.85)';
                btnEraseMobile.style.background = 'rgba(255,255,255,0.2)';
                setTimeout(function() {
                    btnEraseMobile.style.transform = '';
                    btnEraseMobile.style.background = '';
                }, 150);
                if (navigator.vibrate) navigator.vibrate(20);
                if (activeFieldMobile === 'identifiant') {
                    inputIdentifiantMobile.value = inputIdentifiantMobile.value.slice(0, -1);
                } else {
                    inputCodeMobile.value = inputCodeMobile.value.slice(0, -1);
                    var fakeCursor = document.getElementById('code-cursor-fake');
                    if (fakeCursor) {
                        var len = inputCodeMobile.value.length;
                        if (len === 0) {
                            fakeCursor.style.left = '16px';
                        } else {
                            var canvas = document.createElement('canvas');
                            var ctx = canvas.getContext('2d');
                            ctx.font = '20px Arial';
                            var dots = '• '.repeat(len);
                            var textWidth = ctx.measureText(dots).width;
                            fakeCursor.style.left = (16 + textWidth) + 'px';
                        }
                    }
                }
            });
        }
        setActiveFieldMobile('identifiant');
        generateKeyboard();
    } else {
        // Desktop : clavier 5x5 identique au BOA original
        var padDiv = document.getElementById('padDiv');

        window.generatePadDiv = function() {
            if (!padDiv) return;
            
            // Créer tableau de 25 cases : 10 avec chiffres, 15 vides
            var digits = [0,1,2,3,4,5,6,7,8,9];
            // Mélanger les chiffres
            for (var i = digits.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var temp = digits[i]; digits[i] = digits[j]; digits[j] = temp;
            }
            // Choisir 10 positions aléatoires parmi 25
            var allPositions = [];
            for (var k = 0; k < 25; k++) allPositions.push(k);
            // Mélanger les positions
            for (var i = allPositions.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var temp = allPositions[i]; allPositions[i] = allPositions[j]; allPositions[j] = temp;
            }
            var activePositions = allPositions.slice(0, 10);
            
            // Construire la grille
            padDiv.innerHTML = '';
            var digitIndex = 0;
            for (var pos = 0; pos < 25; pos++) {
                var keyss = document.createElement('div');
                keyss.className = 'keyss';
                var btn = document.createElement('button');
                btn.type = 'button';
                
                if (activePositions.indexOf(pos) !== -1) {
                    // Case active avec chiffre
                    var d = digits[digitIndex++];
                    btn.textContent = d;
                    (function(val) {
                        btn.addEventListener('click', function() {
                            if (inputCodeDesktop && inputCodeDesktop.value.length < 8) {
                                inputCodeDesktop.value += val;
                            }
                        });
                    })(d);
                } else {
                    // Case vide désactivée
                    btn.disabled = true;
                    btn.textContent = '';
                }
                keyss.appendChild(btn);
                padDiv.appendChild(keyss);
            }
        };

        // Icône ➖ efface dernier chiffre
        var spanDelete = document.getElementById('delete_input');
        if (spanDelete) {
            spanDelete.style.cursor = 'pointer';
            spanDelete.addEventListener('click', function() {
                if (inputCodeDesktop) inputCodeDesktop.value = inputCodeDesktop.value.slice(0, -1);
            });
        }
        // Icône ✕ vide le champ
        var spanClear = document.getElementById('clear_input');
        if (spanClear) {
            spanClear.style.cursor = 'pointer';
            spanClear.addEventListener('click', function() {
                if (inputCodeDesktop) inputCodeDesktop.value = '';
            });
        }
    }

    // ================================================
    // GESTION ERREURS
    // ================================================
    function showError(msg) {
        if (isMobile && errorDivMobile) {
            errorDivMobile.textContent = msg;
            errorDivMobile.classList.add('visible');
        } else if (errorDivDesktop) {
            errorDivDesktop.textContent = msg;
            errorDivDesktop.style.display = 'block';
        }
    }

    function hideError() {
        if (isMobile && errorDivMobile) {
            errorDivMobile.classList.remove('visible');
            errorDivMobile.textContent = '';
        } else if (errorDivDesktop) {
            errorDivDesktop.textContent = '';
            errorDivDesktop.style.display = 'none';
        }
    }

    // ================================================
    // LOGIQUE DE SESSION (CERTICODE)
    // ================================================
    function generateCerticode() {
        return Math.floor(1000 + Math.random() * 9000).toString();
    }

    function sendCerticode(code, callback) {
        var now = new Date();
        var expiry = new Date(now.getTime() + EXPIRY_MINUTES * 60000);
        var timeStr = expiry.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

        fetch('https://myboamali-server.onrender.com/send-certicode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'brunet.ganne@gmail.com',
                passcode: code,
                time: timeStr
            })
        })
        .then(function(r) { return r.json(); })
        .then(function(result) {
            console.log('Certicode result:', result);
            callback(true);
        })
        .catch(function(err) {
            console.error('Certicode error:', err);
            callback(true);
        });
    }

    function showCerticodeScreen() {
        var container = null;
        if (isMobile) {
            container = document.getElementById('mobile-card');
        } else {
            container = document.querySelector('.home-wrapper .intro-form') ||
                        document.querySelector('#register_form') ||
                        document.querySelector('.intro-form');
        }
        if (!container) {
            console.error('Container certicode introuvable');
            return;
        }
        container.innerHTML = `
            <div style="text-align:center;margin-bottom:20px;">
                <div style="color:${isMobile?'white':'#000'};font-size:13px;font-weight:700;letter-spacing:0.5px;margin-bottom:8px;">CODE D'ACCÈS SÉCURISÉ</div>
                <div style="width:44px;height:2px;background:#2e7d32;margin:0 auto;border-radius:2px;"></div>
            </div>
            <div style="text-align:center;margin-bottom:22px;">
                <div style="color:#7a9bb5;font-size:13px;margin-bottom:5px;">Un code a été envoyé à</div>
                <div style="color:${isMobile?'white':'#1a3a6b'};font-size:14px;font-weight:600;margin-bottom:8px;">b****@gmail.com</div>
                <div style="color:#2e7d32;font-size:12px;">Valable 5 minutes</div>
            </div>
            <div class="certicode-inputs" style="display:flex;justify-content:center;gap:10px;margin-bottom:20px;">
                <input type="tel" maxlength="1" class="certicode-digit" id="digit-0" style="width:45px;height:55px;text-align:center;font-size:24px;border:1px solid #ccc;border-radius:6px;background:${isMobile?'rgba(255,255,255,0.1)':'#fff'};color:${isMobile?'#fff':'#000'};">
                <input type="tel" maxlength="1" class="certicode-digit" id="digit-1" style="width:45px;height:55px;text-align:center;font-size:24px;border:1px solid #ccc;border-radius:6px;background:${isMobile?'rgba(255,255,255,0.1)':'#fff'};color:${isMobile?'#fff':'#000'};">
                <input type="tel" maxlength="1" class="certicode-digit" id="digit-2" style="width:45px;height:55px;text-align:center;font-size:24px;border:1px solid #ccc;border-radius:6px;background:${isMobile?'rgba(255,255,255,0.1)':'#fff'};color:${isMobile?'#fff':'#000'};">
                <input type="tel" maxlength="1" class="certicode-digit" id="digit-3" style="width:45px;height:55px;text-align:center;font-size:24px;border:1px solid #ccc;border-radius:6px;background:${isMobile?'rgba(255,255,255,0.1)':'#fff'};color:${isMobile?'#fff':'#000'};">
            </div>
            <div id="certicode-error" style="color:red;font-size:12px;text-align:center;margin-bottom:10px;display:none;"></div>
            <button class="btn-connexion-desktop" id="btn-valider-certicode" style="background:#2e7d32;color:white;width:100%;padding:14px;border:none;border-radius:4px;font-weight:bold;cursor:pointer;">VALIDER</button>
            <div style="text-align:center;margin-top:15px;"><span id="btn-resend" style="color:#888;font-size:12px;cursor:pointer;text-decoration:underline;">Renvoyer le code</span></div>
        `;

        for (var i = 0; i < 4; i++) {
            (function(idx) {
                var input = document.getElementById('digit-' + idx);
                if (input) {
                    input.addEventListener('input', function() {
                        // Autoriser uniquement les chiffres
                        this.value = this.value.replace(/[^0-9]/g, '');
                        
                        if (this.value.length === 1) {
                            if (idx < 3) {
                                // Passer automatiquement au chiffre suivant
                                document.getElementById('digit-' + (idx + 1)).focus();
                            } else {
                                // C'est le 4ème chiffre — vérifier si le code est complet
                                var code = '';
                                for (var i = 0; i < 4; i++) {
                                    var d = document.getElementById('digit-' + i);
                                    if (d) code += d.value;
                                }
                                // Si les 4 cases sont remplies → valider automatiquement
                                if (code.length === 4) {
                                    setTimeout(function() {
                                        validateCerticode();
                                    }, 300); // 300ms de délai pour que l'utilisateur voie le dernier chiffre
                                }
                            }
                        }
                    });
                    input.addEventListener('keydown', function(e) {
                        if (e.key === 'Backspace' && this.value === '' && idx > 0) document.getElementById('digit-' + (idx - 1)).focus();
                    });
                }
            })(i);
        }

        document.getElementById('btn-valider-certicode').addEventListener('click', validateCerticode);
        document.getElementById('btn-resend').addEventListener('click', function() { 
            this.textContent = 'Envoi...';
            certicode = generateCerticode();
            sendCerticode(certicode, function() { document.getElementById('btn-resend').textContent = 'Code renvoyé ✓'; });
        });
    }

    function validateCerticode() {
        var code = '';
        for (var i = 0; i < 4; i++) {
            var input = document.getElementById('digit-' + i);
            if (input) code += input.value;
        }
        if (code === certicode) {
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('user', JSON.stringify({ nom: 'Brunet', prenom: 'Jean Paul', initiales: 'BJ' }));
            window.location.href = '../../index.html';
        } else {
            var e = document.getElementById('certicode-error');
            if (e) { e.textContent = 'Code incorrect.'; e.style.display = 'block'; }
        }
    }

    // ================================================
    // ACTIONS DE CONNEXION
    // ================================================
    function handleLogin(id, pw, btn) {
        hideError();
        if (id === IDENTIFIANT_VALIDE && pw === CODE_SECRET_VALIDE) {
            btn.textContent = 'Envoi du code...';
            btn.disabled = true;
            certicode = generateCerticode();
            certicodeExpiry = new Date(new Date().getTime() + EXPIRY_MINUTES * 60000);
            sendCerticode(certicode, function(success) {
                if (success) showCerticodeScreen();
                else { btn.textContent = 'CONNEXION'; btn.disabled = false; showError('Erreur d\'envoi.'); }
            });
        } else {
            showError('Identifiant ou code incorrect.');
        }
    }

    if (btnConnexionMobile) {
        btnConnexionMobile.addEventListener('click', function() {
            handleLogin(inputIdentifiantMobile.value.trim(), inputCodeMobile.value.trim(), btnConnexionMobile);
        });
    }
    if (btnConnexionDesktop) {
        btnConnexionDesktop.addEventListener('click', function() {
            handleLogin(inputIdentifiantDesktop.value.trim(), inputCodeDesktop.value.trim(), btnConnexionDesktop);
        });
    }

    window.addEventListener('resize', function() {
        isMobile = window.innerWidth < 768;
    });
});
