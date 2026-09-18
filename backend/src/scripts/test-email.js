import { sendTestEmail } from '../services/emailService.js';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("=== Test d'envoi d'email avec Brevo ===");

// Vérification de la configuration
if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
  console.log("⚠️  ATTENTION : Vos variables d'environnement SMTP_USER et/ou SMTP_PASSWORD ne sont pas définies.");
  console.log("Avez-vous bien ajouté les informations de Brevo dans votre fichier .env ?");
  process.exit(1);
}

rl.question("Entrez l'adresse email de destination pour le test : ", async (email) => {
  if (!email || !email.includes('@')) {
    console.log("❌ Adresse email invalide.");
    rl.close();
    process.exit(1);
  }

  console.log(`\nEnvoi en cours vers ${email}...`);
  
  const result = await sendTestEmail(email);
  
  if (result.success) {
    console.log("\n✅ Email envoyé avec succès !");
    console.log("Vérifiez votre boîte de réception (et vos spams au cas où).");
  } else {
    console.log("\n❌ L'envoi a échoué. Vérifiez vos identifiants SMTP et votre connexion.");
  }
  
  rl.close();
  process.exit(0);
});
