import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Création du transporteur SMTP réutilisable
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

/**
 * Envoie un email de test simple
 * @param {string} to - Adresse email du destinataire
 */
export const sendTestEmail = async (to) => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM || 'Alertes Tribuneo'}" <${process.env.EMAIL_FROM || 'alertes@tribuneo.xyz'}>`,
      to: to,
      subject: "Test d'intégration SMTP (Brevo) ✔",
      text: "Bonjour, ceci est un email de test envoyé depuis votre serveur Node.js via Brevo !",
      html: "<b>Bonjour</b>,<br>Ceci est un email de test envoyé depuis votre serveur Node.js via <b>Brevo</b> !<br><br>Si vous recevez ceci, la configuration SMTP fonctionne parfaitement.",
    });

    console.log("Message envoyé : %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email :", error);
    return { success: false, error };
  }
};

/**
 * Exemple de fonction d'alerte pour une liquidation (dépréciée par sendGeographicAlert)
 */
export const sendLiquidationAlert = async (to, companyName) => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM || 'Alertes Tribuneo'}" <${process.env.EMAIL_FROM || 'alertes@tribuneo.xyz'}>`,
      to: to,
      subject: `[Alerte] Nouvelle liquidation : ${companyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Alerte Tribuneo 🚨</h2>
          <p>L'entreprise <b>${companyName}</b> vient d'entrer en procédure de liquidation.</p>
          <p>Consultez la carte sur tribuneo.xyz pour plus de détails et évaluer les opportunités.</p>
        </div>
      `,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'alerte :", error);
    return { success: false, error };
  }
};

/**
 * Envoie une alerte basée sur le périmètre géographique de l'utilisateur
 */
export const sendGeographicAlert = async (to, companyName, procedureType, alertCity) => {
  try {
    // Majuscule sur le type de procédure
    const formatType = procedureType.charAt(0).toUpperCase() + procedureType.slice(1);
    
    // Définition des couleurs de la charte graphique (Indigo Tailwind)
    const primaryColor = "#6366f1"; // Indigo-500
    const bgColor = "#f9fafb"; // Gray-50
    const textColor = "#1f2937"; // Gray-800
    
    const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Alerte Tribuneo</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: ${bgColor}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: ${textColor};">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${bgColor}; padding: 40px 0;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
              
              <!-- Header -->
              <tr>
                <td align="center" style="padding: 30px 40px; background-color: #ffffff; border-bottom: 1px solid #f3f4f6;">
                  <h1 style="margin: 0; color: ${primaryColor}; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Tribuneo</h1>
                </td>
              </tr>
              
              <!-- Body -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 20px 0; font-size: 20px; color: ${textColor};">Nouvelle opportunité près de ${alertCity} 📍</h2>
                  <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #4b5563;">
                    Bonjour,<br><br>
                    Le BODACC vient de publier une nouvelle procédure collective qui correspond exactement à vos critères de surveillance géographique.
                  </p>
                  
                  <!-- Card Info -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 0 8px 8px 0; margin-bottom: 32px;">
                    <tr>
                      <td style="padding: 20px;">
                        <p style="margin: 0 0 8px 0; font-size: 14px; color: #991b1b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Détails de la procédure</p>
                        <p style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #7f1d1d;">🏢 ${companyName}</p>
                        <p style="margin: 0; font-size: 15px; color: #991b1b;">⚖️ ${formatType}</p>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Call to Action -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td align="center">
                        <a href="https://tribuneo.xyz" style="display: inline-block; padding: 14px 32px; background-color: ${primaryColor}; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 6px rgba(99, 102, 241, 0.25);">
                          Voir sur la carte interactive
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #f3f4f6; text-align: center;">
                  <p style="margin: 0 0 10px 0; font-size: 13px; color: #6b7280;">
                    Vous recevez cet email car vous avez configuré une alerte sur Tribuneo.xyz.
                  </p>
                  <p style="margin: 0; font-size: 13px; color: #6b7280;">
                    <a href="https://tribuneo.xyz/dashboard/alertes" style="color: ${primaryColor}; text-decoration: none;">Gérer mes alertes</a> • 
                    <a href="#" style="color: #9ca3af; text-decoration: underline;">Se désabonner</a>
                  </p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM || 'Alertes Tribuneo'}" <${process.env.EMAIL_FROM || 'alertes@tribuneo.xyz'}>`,
      to: to,
      subject: `📍 Nouvelle procédure à ${alertCity} : ${companyName}`,
      html: htmlTemplate,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'alerte géographique :", error);
    return { success: false, error };
  }
};
