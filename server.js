const express = require('express');
const cors    = require('cors');
const https   = require('https');

const app = express();
app.use(cors({
    origin: ['https://myboamali.onrender.com', 'http://localhost:3000', 'http://127.0.0.1:5500'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Origin']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const BREVO_API_KEY = process.env.BREVO_API_KEY;

app.post('/send-virement', (req, res) => {
    try {
        const { email_beneficiaire, nom_beneficiaire, montant, reference, date, bic, iban, motif, pays, pdf_base64 } = req.body;

        if (!email_beneficiaire || !pdf_base64) {
            return res.status(400).json({ success: false, message: 'Email et PDF requis' });
        }

        const pdfData = pdf_base64.replace(/^data:[^;]+;[^,]+,/, '').replace(/\s/g, '');
        console.log('PDF base64 length:', pdfData.length);
        console.log('PDF first 50 chars:', pdfData.substring(0, 50));

        const htmlContent = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8">
<style>
body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
.container { max-width: 600px; margin: 0 auto; background: white; }
.header { background: #0f1923; padding: 25px 30px; }
.green-bar { background: #1D6F4F; height: 4px; }
.ref-bar { background: #f8f9fa; padding: 12px 30px; border-bottom: 1px solid #eee; }
.body { padding: 25px 30px; }
.amount-box { background: #0f1923; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 20px; }
.amount-badge { background: #f39c12; color: white; padding: 4px 15px; border-radius: 12px; font-size: 11px; font-weight: bold; display: inline-block; margin-top: 8px; }
.section-title { background: #f8f9fa; padding: 8px 12px; font-size: 12px; font-weight: bold; color: #333; border-radius: 4px; margin-bottom: 12px; }
.detail-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f0f0f0; }
.detail-label { color: #999; font-size: 12px; text-transform: uppercase; }
.detail-value { color: #1a1a1a; font-size: 13px; font-weight: bold; }
.alert-box { background: #fff8e1; border: 1px solid #f39c12; border-radius: 6px; padding: 12px 15px; margin-bottom: 15px; }
.info-box { background: #f0f7ff; border: 1px solid #3498db; border-radius: 6px; padding: 12px 15px; margin-bottom: 20px; }
.pdf-notice { background: #eaf7f2; border: 1px solid #1D6F4F; border-radius: 6px; padding: 12px 15px; margin-bottom: 20px; text-align: center; }
.footer { background: #0f1923; padding: 15px 30px; text-align: center; }
.badge { background: #f39c12; color: white; padding: 3px 10px; border-radius: 12px; font-size: 10px; font-weight: bold; }
</style>
</head>
<body>
<div class="container">
<div class="header">
<table width="100%"><tr>
<td><div style="color:white;font-size:13px;font-weight:bold;letter-spacing:1px;">BANK OF AFRICA</div>
<div style="color:rgba(180,200,210,0.8);font-size:10px;">BMCE GROUP - MyBOA-MALI</div></td>
<td align="right"><div style="color:white;font-size:18px;font-weight:bold;">AVIS DE VIREMENT</div>
<div style="color:rgba(180,200,210,0.8);font-size:10px;">Ordre de virement international</div></td>
</tr></table>
</div>
<div class="green-bar"></div>
<div class="ref-bar">
<table width="100%"><tr>
<td><div style="font-size:10px;color:#999;">Reference</div><div style="font-weight:bold;color:#1a1a1a;">${reference}</div></td>
<td><div style="font-size:10px;color:#999;">Date emission</div><div style="font-weight:bold;color:#1a1a1a;">${date}</div></td>
<td align="right"><span class="badge">EN ATTENTE DE TRAITEMENT</span></td>
</tr></table>
</div>
<div class="body">
<p style="font-size:15px;color:#333;">Madame, Monsieur <strong>${nom_beneficiaire}</strong>,</p>
<p style="font-size:13px;color:#666;line-height:1.6;">Vous avez recu un ordre de virement international emis en votre faveur par <strong>BRUNET JEAN PAUL</strong> via <strong>MyBOA-MALI</strong>.</p>
<div class="amount-box">
<div style="color:rgba(180,200,210,0.8);font-size:11px;margin-bottom:5px;">MONTANT DU VIREMENT</div>
<div style="color:white;font-size:28px;font-weight:bold;">${montant} CFA</div>
<div class="amount-badge">Virement en attente de traitement</div>
</div>
<div class="section-title">DETAILS DE L OPERATION</div>
<div class="detail-row"><span class="detail-label">BIC / SWIFT</span><span class="detail-value">${bic}</span></div>
<div class="detail-row"><span class="detail-label">IBAN</span><span class="detail-value" style="font-size:12px;">${iban}</span></div>
<div class="detail-row"><span class="detail-label">Pays destinataire</span><span class="detail-value">${pays}</span></div>
<div class="detail-row" style="margin-bottom:20px;"><span class="detail-label">Motif</span><span class="detail-value">${motif || '-'}</span></div>
<div class="pdf-notice">
<p style="color:#1D6F4F;font-size:13px;font-weight:bold;margin:0;">Votre avis de virement est joint a cet email</p>
<small style="color:#666;font-size:11px;">Fichier : Avis-Virement-${reference}.pdf</small>
</div>
<div class="alert-box">
<div style="color:#e67e22;font-size:12px;font-weight:bold;margin-bottom:4px;">DELAI DE TRAITEMENT</div>
<div style="color:#666;font-size:12px;line-height:1.5;">Les fonds seront credites sur votre compte dans un delai de <strong>2 a 5 jours ouvrables</strong>.</div>
</div>
<div class="info-box">
<div style="color:#2980b9;font-size:12px;font-weight:bold;margin-bottom:4px;">INFORMATION IMPORTANTE</div>
<div style="color:#666;font-size:12px;line-height:1.5;">Ce document est un avis de virement officiel emis par MyBOA-MALI. Contact : <strong>support@myboamali.site</strong></div>
</div>
</div>
<div class="footer">
<p style="color:rgba(100,120,140,0.9);font-size:10px;margin:3px 0;">2026 BANK OF AFRICA - MyBOA-MALI - Tous droits reserves</p>
<p style="color:#4CAF50;font-weight:bold;font-size:10px;margin:3px 0;">www.myboamali.site</p>
</div>
</div>
</body>
</html>`;

        const emailData = JSON.stringify({
            sender: { name: 'MyBOA-MALI', email: 'guedeserge72@gmail.com' },
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
                <p style="color:#4CAF50;font-weight:bold;font-size:10px;margin:3px 0;">www.myboamali.site</p>
            </div>
        </div>
        </body>
        </html>`;

        const emailData = JSON.stringify({
            sender: { name: 'MyBOA-MALI', email: 'guedeserge72@gmail.com' },
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

app.get('/ping', (req, res) => {
    res.json({ status: 'ok', message: 'Serveur MyBOA-MALI operationnel' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log('Serveur MyBOA-MALI demarre sur port', PORT);
});
