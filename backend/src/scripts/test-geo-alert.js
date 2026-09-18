import { sendGeographicAlert } from '../services/emailService.js';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' }); // Fallback
dotenv.config(); // Charge le .env courant

const runTest = async () => {
  const email = 'vampiredairy0507@gmail.com';
  console.log(`Envoi de l'alerte géographique de test vers ${email}...`);
  
  const result = await sendGeographicAlert(
    email,
    'Boulangerie Le Petit Mitron', // Nom d'entreprise
    'redressement judiciaire',     // Type de procédure
    'Lyon'                         // Ville de l'alerte
  );

  if (result.success) {
    console.log("✅ Alerte géographique envoyée avec succès !");
  } else {
    console.log("❌ L'envoi a échoué.");
  }
};

runTest();
