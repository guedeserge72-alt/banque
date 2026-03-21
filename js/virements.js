// ================================================
// NAVIGATION ONGLETS VIREMENTS
// ================================================
document.addEventListener('DOMContentLoaded', function() {

    // Navigation sidebar
    var sidebarItems = document.querySelectorAll('#sidebar-virements li');
    var contentPanes = document.querySelectorAll('#content-virements .pane');

    sidebarItems.forEach(function(item) {
        item.addEventListener('click', function() {
            sidebarItems.forEach(function(i) { i.classList.remove('active'); });
            contentPanes.forEach(function(p) { p.classList.add('hidden'); });
            item.classList.add('active');
            var targetId = item.getAttribute('data-pane');
            var targetPane = document.getElementById(targetId);
            if (targetPane) {
                targetPane.classList.remove('hidden');
                if (targetId === 'vir_hist' && typeof afficherHistoriqueVirements === 'function') {
                    afficherHistoriqueVirements();
                }
            }
        });
    });

    // Checkbox virement permanent
    var isPermanent = document.getElementById('is-permanent');
    var permanentFields = document.getElementById('permanent-fields');
    if (isPermanent && permanentFields) {
        isPermanent.addEventListener('change', function() {
            if (this.checked) {
                permanentFields.classList.remove('hidden');
            } else {
                permanentFields.classList.add('hidden');
            }
        });
    }

    // Bouton initier virement
    var btnInitier = document.getElementById('btn-initier-virement');
    if (btnInitier) {
        btnInitier.addEventListener('click', initierVirement);
    }

    // Select mobile virements
    var mobileSelect = document.querySelector('#section-virements .mobile-section-select');
    if (mobileSelect) {
        mobileSelect.addEventListener('change', function() {
            var targetId = this.value;
            contentPanes.forEach(function(p) { p.classList.add('hidden'); });
            var targetPane = document.getElementById(targetId);
            if (targetPane) {
                targetPane.classList.remove('hidden');
                if (targetId === 'vir_hist' && typeof afficherHistoriqueVirements === 'function') {
                    afficherHistoriqueVirements();
                }
            }
        });
    }
});

// ================================================
// CONFIGURATION
// ================================================
var EMAILJS_SERVICE_ID        = 'service_myboamali';
var EMAILJS_TEMPLATE_VIREMENT = 'template_nkqps0x';
var EMAILJS_PUBLIC_KEY        = 'sTmdjsE3v4fxIs-Up';
var SERVER_URL                = 'https://myboamali-server.onrender.com';

// ================================================
// FORMATER MONTANT POUR PDF (évite les espaces insécables)
// ================================================
function formatMontantPDF(montant) {
    return montant.toString().replace(/\s/g, ' ').replace(/\u00a0/g, ' ');
}

// ================================================
// GÉNÉRER RÉFÉRENCE UNIQUE
// ================================================
function generateReference() {
    var now = new Date();
    var year = now.getFullYear();
    var random = Math.floor(1000000 + Math.random() * 9000000);
    return 'VIR-' + year + '-' + random;
}

// ================================================
// GÉNÉRER LE PDF RÉCAPITULATIF
// ================================================
function generateVirementPDF(data) {
    return new Promise(function(resolve) {
        var doc = new window.jspdf.jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        var pageWidth  = doc.internal.pageSize.getWidth();
        var pageHeight = doc.internal.pageSize.getHeight();

        // HEADER
        doc.setFillColor(15, 25, 35);
        doc.rect(0, 0, pageWidth, 45, 'F');
        doc.setFillColor(29, 111, 79);
        doc.rect(0, 0, 4, 45, 'F');

        // Logo BOA
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(12, 8, 26, 26, 3, 3, 'F');
        try {
            doc.addImage('clientBOA/css/themes/ML045/images/favicon.png', 'PNG', 13, 9, 24, 24);
        } catch(e) {
            doc.setTextColor(29, 111, 79);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('B', 22, 25);
        }

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('BANK OF AFRICA', 44, 20);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(180, 200, 210);
        doc.text('BMCE GROUP · MyBOA-MALI', 44, 27);

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('AVIS DE VIREMENT', pageWidth - 15, 20, { align: 'right' });
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(180, 200, 210);
        doc.text('Ordre de virement international', pageWidth - 15, 27, { align: 'right' });
        doc.text('Document officiel', pageWidth - 15, 33, { align: 'right' });

        // BANDE RÉFÉRENCE
        doc.setFillColor(248, 249, 250);
        doc.rect(0, 45, pageWidth, 14, 'F');
        doc.setDrawColor(238, 238, 238);
        doc.line(0, 59, pageWidth, 59);

        doc.setTextColor(100, 100, 100);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text('Référence', 15, 51);
        doc.text('Date d\'émission', 70, 51);
        doc.text('Type', 140, 51);

        doc.setTextColor(26, 26, 26);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(data.reference, 15, 57);
        doc.text(data.date, 70, 57);
        doc.text('SWIFT International', 140, 57);

        doc.setFillColor(243, 156, 18);
        doc.roundedRect(pageWidth - 55, 47, 45, 10, 3, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text('EN ATTENTE DE TRAITEMENT', pageWidth - 32, 53.5, { align: 'center' });

        // MESSAGE
        var y = 68;
        doc.setTextColor(80, 80, 80);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text((data.civilite || 'Monsieur') + ' ' + data.nom_beneficiaire + ',', 15, y);
        y += 6;
        var message = 'Un ordre de virement international a été émis en votre faveur par BRUNET JEAN PAUL via MyBOA-MALI.';
        var msgLines = doc.splitTextToSize(message, pageWidth - 30);
        doc.text(msgLines, 15, y);
        y += msgLines.length * 5 + 4;

        // MONTANT HERO
        doc.setFillColor(15, 25, 35);
        doc.roundedRect(15, y, pageWidth - 30, 30, 4, 4, 'F');
        doc.setTextColor(180, 200, 210);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('MONTANT DU VIREMENT', pageWidth / 2, y + 8, { align: 'center' });
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text(data.montant + ' ' + (data.devise || 'CFA'), pageWidth / 2, y + 18, { align: 'center' });
        doc.setFillColor(243, 156, 18);
        doc.roundedRect(pageWidth / 2 - 45, y + 21, 90, 7, 3, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text('Virement en attente de traitement', pageWidth / 2, y + 25.5, { align: 'center' });
        y += 38;

        // DONNEUR D'ORDRE + BÉNÉFICIAIRE
        var colW  = (pageWidth - 35) / 2;
        var col2X = 15 + colW + 5;

        doc.setFillColor(29, 111, 79);
        doc.roundedRect(15, y, colW, 8, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('DONNEUR D\'ORDRE', 15 + colW / 2, y + 5.5, { align: 'center' });
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(15, y + 8, colW, 38, 2, 2, 'F');
        doc.setTextColor(150, 150, 150); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
        doc.text('Nom complet', 18, y + 15);
        doc.setTextColor(26, 26, 26); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
        doc.text('BRUNET JEAN PAUL', 18, y + 20);
        doc.setTextColor(150, 150, 150); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
        doc.text('Banque émettrice', 18, y + 27);
        doc.setTextColor(26, 26, 26); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
        doc.text('Bank Of Africa — MyBOA-MALI', 18, y + 32);
        doc.setTextColor(150, 150, 150); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
        doc.text('Pays', 18, y + 39);
        doc.setTextColor(26, 26, 26); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
        doc.text('Mali', 18, y + 44);

        doc.setFillColor(15, 25, 35);
        doc.roundedRect(col2X, y, colW, 8, 2, 2, 'F');
        doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
        doc.text('BÉNÉFICIAIRE', col2X + colW / 2, y + 5.5, { align: 'center' });
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(col2X, y + 8, colW, 38, 2, 2, 'F');
        doc.setTextColor(150, 150, 150); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
        doc.text('Nom complet', col2X + 3, y + 15);
        doc.setTextColor(26, 26, 26); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
        doc.text(data.nom_beneficiaire, col2X + 3, y + 20);
        doc.setTextColor(150, 150, 150); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
        doc.text('Banque', col2X + 3, y + 27);
        doc.setTextColor(26, 26, 26); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
        doc.text(data.nom_banque, col2X + 3, y + 32);
        doc.setTextColor(150, 150, 150); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
        doc.text('IBAN', col2X + 3, y + 39);
        doc.setTextColor(26, 26, 26); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
        doc.text(data.iban, col2X + 3, y + 44);
        y += 52;

        // DÉTAILS OPÉRATION
        doc.setFillColor(248, 249, 250);
        doc.roundedRect(15, y, pageWidth - 30, 8, 2, 2, 'F');
        doc.setTextColor(26, 26, 26); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
        doc.text('DÉTAILS DE L\'OPÉRATION', 18, y + 5.5);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(15, y + 8, pageWidth - 30, 30, 2, 2, 'F');
        var col3W = (pageWidth - 30) / 3;
        doc.setTextColor(150, 150, 150); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
        doc.text('Date d\'émission', 18, y + 15);
        doc.text('Pays destinataire', 18 + col3W, y + 15);
        doc.text('Charges', 18 + col3W * 2, y + 15);
        doc.setTextColor(26, 26, 26); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
        doc.text(data.date, 18, y + 21);
        doc.text(data.pays, 18 + col3W, y + 21);
        doc.text(data.charges || 'À ma charge', 18 + col3W * 2, y + 21);
        doc.setTextColor(150, 150, 150); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
        doc.text('BIC / SWIFT', 18, y + 28);
        doc.text('Motif', 18 + col3W, y + 28);
        doc.text('Adresse bénéficiaire', 18 + col3W * 2, y + 28);
        doc.setTextColor(26, 26, 26); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
        doc.text(data.bic, 18, y + 34);
        doc.text(data.motif || '-', 18 + col3W, y + 34);
        var adresseLines = doc.splitTextToSize(data.adresse || '-', col3W - 5);
        doc.setFontSize(8);
        doc.text(adresseLines, 18 + col3W * 2, y + 34);
        y += 44;

        // DÉLAI
        doc.setFillColor(255, 248, 225);
        doc.roundedRect(15, y, pageWidth - 30, 18, 3, 3, 'F');
        doc.setDrawColor(243, 156, 18); doc.setLineWidth(0.5);
        doc.roundedRect(15, y, pageWidth - 30, 18, 3, 3, 'S');
        doc.setTextColor(230, 126, 34); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
        doc.text('DÉLAI DE TRAITEMENT', 20, y + 7);
        doc.setTextColor(100, 100, 100); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
        var delaiLines = doc.splitTextToSize('Les fonds seront crédités sur votre compte dans un délai de 2 à 5 jours ouvrables selon les procédures interbancaires internationales.', pageWidth - 40);
        doc.text(delaiLines, 20, y + 13);
        y += 24;

        // INFO IMPORTANTE
        doc.setFillColor(240, 247, 255);
        doc.roundedRect(15, y, pageWidth - 30, 18, 3, 3, 'F');
        doc.setDrawColor(52, 152, 219);
        doc.roundedRect(15, y, pageWidth - 30, 18, 3, 3, 'S');
        doc.setTextColor(41, 128, 185); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
        doc.text('INFORMATION IMPORTANTE', 20, y + 7);
        doc.setTextColor(100, 100, 100); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
        var infoLines = doc.splitTextToSize('Ce document est un avis de virement officiel émis par MyBOA-MALI. Conservez-le comme preuve de transaction. Contact : support@myboamali.net', pageWidth - 40);
        doc.text(infoLines, 20, y + 13);

        // FOOTER
        doc.setFillColor(15, 25, 35);
        doc.rect(0, pageHeight - 14, pageWidth, 14, 'F');
        doc.setTextColor(100, 120, 140); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
        doc.text('© 2026 BANK OF AFRICA · MyBOA-MALI · Tous droits réservés', 15, pageHeight - 6);
        doc.text('Document généré automatiquement — Non modifiable', pageWidth / 2, pageHeight - 6, { align: 'center' });
        doc.setTextColor(76, 175, 80); doc.setFont('helvetica', 'bold');
        doc.text('www.myboamali.net', pageWidth - 15, pageHeight - 6, { align: 'right' });

        var pdfBase64 = doc.output('datauristring');
        resolve(pdfBase64);
    });
}

// ================================================
// ENVOYER EMAIL AU BÉNÉFICIAIRE VIA SERVEUR
// ================================================
function sendEmailBeneficiaire(data, pdfBase64, callback) {
    console.log('Envoi email bénéficiaire:', data.email_beneficiaire);
    fetch(SERVER_URL + '/send-virement', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://myboamali.onrender.com'
        },
        body: JSON.stringify({
            email_beneficiaire: data.email_beneficiaire,
            nom_beneficiaire:   data.nom_beneficiaire,
            montant:            data.montant,
            reference:          data.reference,
            date:               data.date,
            bic:                data.bic,
            iban:               data.iban,
            motif:              data.motif || '-',
            pays:               data.pays,
            devise:             data.devise,
            civilite:           data.civilite,
            pdf_base64:         pdfBase64
        })
    })
    .then(function(r) { return r.json(); })
    .then(function(result) {
        console.log('Réponse serveur:', result);
        callback(result.success);
    })
    .catch(function(error) {
        console.error('Erreur:', error);
        callback(false);
    });
}

// ================================================
// TOAST
// ================================================
function showToastVirement(message, type) {
    var existing = document.getElementById('toast-virement');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.id = 'toast-virement';
    toast.style.cssText = 'position:fixed;top:20px;right:20px;background:' + (type === 'success' ? '#0f1923' : '#e74c3c') + ';color:white;padding:20px 24px;border-radius:10px;font-size:13px;font-weight:500;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.4);min-width:340px;border-left:4px solid #1D6F4F;';
    toast.innerHTML = '<span style="white-space:pre-line; font-family: monospace; font-size:12px;">' + message + '</span>';

    var progress = document.createElement('div');
    progress.style.cssText = 'position:absolute;bottom:0;left:0;height:3px;background:rgba(255,255,255,0.4);border-radius:0 0 10px 10px;width:100%;animation:progressBar 5s linear forwards;';
    toast.appendChild(progress);

    var style = document.createElement('style');
    style.textContent = '@keyframes progressBar{from{width:100%}to{width:0%}}';
    document.head.appendChild(style);
    document.body.appendChild(toast);

    setTimeout(function() { toast.remove(); }, 5000);
}

// ================================================
// DÉTERMINER CIVILITÉ
// ================================================
function determinerCivilite(nom) {
    var prenomsFeminins = ['marie','sophie','julie','laura','sarah','emma','camille','lea','lucie','chloe','alice','manon','pauline','amelie','claire','isabelle','nathalie','fatima','aminata','mariama','kadiatou','aissatou','fatoumata','mariam','oumou','hawa','bintou','safiatou','kadija','ramata','coumba','rokhaya','adja','astou','yacine','ndey','ndéye','ndèye','awa','maïmouna','maimuna','rokia','salimata','maïssa','aby'];
    var mots = nom.toLowerCase().split(' ');
    for (var i = 0; i < mots.length; i++) {
        if (prenomsFeminins.indexOf(mots[i]) !== -1) return 'Madame';
    }
    return 'Monsieur';
}

// ================================================
// FONCTION PRINCIPALE
// ================================================
function initierVirement() {
    var nom        = document.getElementById('vir-nom')      ? document.getElementById('vir-nom').value.trim()      : '';
    var pays       = document.getElementById('vir-pays')     ? document.getElementById('vir-pays').value.trim()     : '';
    var bic        = document.getElementById('vir-bic')      ? document.getElementById('vir-bic').value.trim()      : '';
    var nomBanque  = document.getElementById('vir-banque')   ? document.getElementById('vir-banque').value.trim()   : '';
    var iban       = document.getElementById('vir-iban')     ? document.getElementById('vir-iban').value.trim()     : '';
    var adresse    = document.getElementById('vir-adresse')  ? document.getElementById('vir-adresse').value.trim()  : '';
    var emailBenef = document.getElementById('vir-email')    ? document.getElementById('vir-email').value.trim()    : '';
    var montantStr = document.getElementById('vir-montant')  ? document.getElementById('vir-montant').value.trim()  : '';
    var motif      = document.getElementById('vir-motif')    ? document.getElementById('vir-motif').value.trim()    : '';
    var charges    = document.getElementById('vir-charges')  ? document.getElementById('vir-charges').value.trim()  : 'À ma charge';
    var devise     = document.getElementById('vir-devise')   ? document.getElementById('vir-devise').value.trim()   : 'CFA';
    var dateVal    = document.getElementById('vir-date')     ? document.getElementById('vir-date').value.trim()     : '';

    // VALIDATION
    var errors = [];
    if (!nom)        errors.push('vir-nom');
    if (!pays)       errors.push('vir-pays');
    if (!bic)        errors.push('vir-bic');
    if (!iban)       errors.push('vir-iban');
    if (!montantStr) errors.push('vir-montant');
    if (!dateVal)    errors.push('vir-date');

    document.querySelectorAll('.vir-field').forEach(function(el) {
        el.style.borderColor = '';
        el.style.boxShadow   = '';
    });

    if (errors.length > 0) {
        errors.forEach(function(id) {
            var el = document.getElementById(id);
            if (el) { el.style.borderColor = '#e74c3c'; el.style.boxShadow = '0 0 0 2px rgba(231,76,60,0.2)'; }
        });
        showToastVirement('Veuillez remplir tous les champs obligatoires.', 'error');
        return;
    }

    var montant = parseFloat(montantStr.replace(/\s/g, '').replace(',', '.'));
    if (isNaN(montant) || montant <= 0) {
        showToastVirement('Le montant saisi est invalide.', 'error');
        return;
    }

    var soldeActuel = parseFloat(localStorage.getItem('solde_courant') || '1311800000');
    if (montant > soldeActuel) {
        showToastVirement('Solde insuffisant pour effectuer ce virement.', 'error');
        return;
    }

    var btnInitier = document.getElementById('btn-initier-virement');
    if (btnInitier) { btnInitier.textContent = 'Traitement en cours...'; btnInitier.disabled = true; }

    var now = new Date();
    var dateFormatted = now.toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' }) + ' à ' + now.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });

    var virementData = {
        nom_beneficiaire:   nom.toUpperCase(),
        pays:               pays,
        bic:                bic.toUpperCase(),
        nom_banque:         nomBanque,
        iban:               iban.toUpperCase(),
        adresse:            adresse,
        email_beneficiaire: emailBenef,
        montant:            formatMontantPDF(montant.toLocaleString('fr-FR')),
        devise:             document.getElementById('vir-devise') ? document.getElementById('vir-devise').value : 'CFA',
        civilite:           determinerCivilite(nom),
        motif:              motif,
        charges:            charges,
        date:               dateFormatted,
        reference:          generateReference()
    };

    generateVirementPDF(virementData).then(function(pdfBase64) {

        function afterEmail() {
            // Débiter le solde via accueil.js
            var montantNum = parseFloat(virementData.montant.replace(/\s/g, '').replace(',', '.'));
            var deviseVirement = virementData.devise || 'CFA';
            if (window.debiterSolde) {
                window.debiterSolde(montantNum, deviseVirement);
            }

            // Ajouter à l'historique
            if (window.ajouterHistorique) {
                window.ajouterHistorique({
                    date: virementData.date,
                    type: 'Virement international',
                    description: 'Vers ' + virementData.nom_beneficiaire,
                    montant: virementData.montant,
                    devise: deviseVirement,
                    reference: virementData.reference,
                    statut: 'En attente de traitement',
                    email_beneficiaire: virementData.email_beneficiaire,
                    nom_beneficiaire: virementData.nom_beneficiaire,
                    civilite: virementData.civilite || 'Monsieur',
                    date_expiration: new Date(new Date().getTime() + 10 * 60 * 1000).toISOString()
                });
            }

            // Ajouter notification avec devise
            if (window.ajouterNotification) {
                window.ajouterNotification(
                    'Virement de ' + virementData.montant + ' ' + deviseVirement + ' initié — Réf: ' + virementData.reference,
                    'virement'
                );
            }

            showToastVirement(
                'VIREMENT INTERNATIONAL — INITIÉ\n' +
                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
                'Référence    : ' + virementData.reference + '\n' +
                'Montant      : ' + virementData.montant + ' ' + (virementData.devise || 'CFA') + '\n' +
                'Bénéficiaire : ' + virementData.nom_beneficiaire + '\n' +
                'Statut       : En attente de traitement\n' +
                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
                'Avis de virement envoyé par email ✓',
                'success'
            );
            console.log('VIREMENT OK - Référence:', virementData.reference);

            setTimeout(function() {
                resetVirementForm();
                if (btnInitier) {
                    btnInitier.textContent = 'INITIER UN VIREMENT';
                    btnInitier.disabled = false;
                }
            }, 2000);
        }

        if (emailBenef) {
            sendEmailBeneficiaire(virementData, pdfBase64, function(success) {
                if (!success) console.warn('Email non envoyé mais virement effectué');
                afterEmail();
            });
        } else {
            afterEmail();
        }
    });
}

// ================================================
// AJOUTER TRANSACTION AU RELEVÉ
// ================================================
function ajouterTransaction(tx) {
    var transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    transactions.unshift(tx);
    localStorage.setItem('transactions', JSON.stringify(transactions));

    var releveContainer = document.querySelector('.releve-operations, #releve-operations, .releve-container');
    if (releveContainer) {
        var row = document.createElement('div');
        row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #2a3a4a;';
        row.innerHTML = '<div><div style="color:white;font-size:12px;font-weight:600;">' + tx.libelle + '</div><div style="color:#7a9bb5;font-size:10px;margin-top:2px;">' + tx.date + ' · ' + tx.type + '</div></div><div style="color:#e74c3c;font-size:12px;font-weight:700;">' + tx.montant.toLocaleString('fr-FR') + ' CFA</div>';
        releveContainer.insertBefore(row, releveContainer.firstChild);
    }
}

// ================================================
// RÉINITIALISER FORMULAIRE
// ================================================
function resetVirementForm() {
    ['vir-nom','vir-pays','vir-bic','vir-banque','vir-iban','vir-adresse','vir-email','vir-montant','vir-motif','vir-date'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) { el.value = ''; el.style.borderColor = ''; el.style.boxShadow = ''; }
    });
}

// ================================================
// HISTORIQUE DES VIREMENTS (FILTRES & DONNÉES)
// ================================================
function afficherHistoriqueVirements() {
    var tbody = document.getElementById('tbody-virement-historique');
    if (!tbody) return;

    var config = {
        type:   document.getElementById('filt-vir-type').value,
        date:   document.getElementById('filt-vir-date').value,
        statut: document.getElementById('filt-vir-statut').value
    };

    var historique = (window._dashboardData && window._dashboardData.historique) || [];
    
    // Filtrage
    var filtered = historique.filter(function(op) {
        var matchType = true;
        if (config.type) {
            matchType = op.type.toLowerCase().indexOf(config.type.toLowerCase()) !== -1;
        }

        var matchDate = true;
        if (config.date) {
            // op.date est au format "DD/MM/YYYY à HH:mm"
            var parts = op.date.split(' ')[0].split('/');
            var opDateISO = parts[2] + '-' + parts[1] + '-' + parts[0];
            matchDate = opDateISO === config.date;
        }

        var matchStatut = true;
        if (config.statut) {
            if (config.statut === 'En attente') {
                matchStatut = op.statut === 'En attente de traitement';
            } else if (config.statut === 'Exécuté') {
                matchStatut = (op.statut === 'Exécuté' || op.statut === 'Validé');
            } else if (config.statut === 'Rejeté') {
                matchStatut = op.statut === 'Rejeté';
            }
        }

        return matchType && matchDate && matchStatut;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Aucune opération trouvée avec ces filtres.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    filtered.forEach(function(op) {
        var tr = document.createElement('tr');
        var color = '#fff';
        var badgeBg = '#fff3cd';
        var badgeColor = '#856404';
        var label = op.statut;

        if (op.statut === 'En attente de traitement') {
            label = 'En attente';
        } else if (op.statut === 'Exécuté' || op.statut === 'Validé') {
            badgeBg = '#d4edda'; badgeColor = '#155724'; label = 'Exécuté';
        } else if (op.statut === 'Rejeté') {
            badgeBg = '#fde8e8'; badgeColor = '#c0392b';
        }

        tr.innerHTML = 
            '<td data-label="Date">' + op.date + '</td>' +
            '<td data-label="Type">' + op.type + '</td>' +
            '<td data-label="Bénéficiaire">' + op.description.replace('Vers ','') + '</td>' +
            '<td data-label="Montant" style="font-weight:700; color:#e74c3c;">-' + op.montant + ' ' + op.devise + '</td>' +
            '<td data-label="Statut"> <span style="background:' + badgeBg + '; color:' + badgeColor + '; padding:3px 10px; border-radius:10px; font-size:11px; font-weight:700;">' + label + '</span></td>';
        tbody.appendChild(tr);
    });
}

// Initialisation des listeners
document.addEventListener('DOMContentLoaded', function() {
    ['filt-vir-type', 'filt-vir-date', 'filt-vir-statut'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.addEventListener('change', afficherHistoriqueVirements);
    });
    
    // Initial call
    setTimeout(afficherHistoriqueVirements, 1000);
});


