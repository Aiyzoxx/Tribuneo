import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  const results = [];
  const csvPath = path.join(__dirname, 'contacts.csv');

  console.log(`Lecture du fichier CSV: ${csvPath}`);

  fs.createReadStream(csvPath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      console.log(`Parsing terminé. ${results.length} lignes trouvées.`);
      let imported = 0;

      for (const row of results) {
        try {
          await prisma.directoryContact.create({
            data: {
              prenom: row['Prénom'] || null,
              nom: row['Nom'] || null,
              titre_poste: row['Titre / Poste'] || null,
              entreprise: row['Entreprise'] || null,
              email: row['E-mail'] || null,
              telephone_fixe: row['Téléphone fixe'] || null,
              telephone_mobile: row['Téléphone mobile'] || null,
              site_web: row['Site web'] || null,
              adresse_postale: row['Adresse postale complète'] || null,
              ville: row['Ville'] || null,
              code_postal: row['Code postal'] || null,
              pays: row['Pays'] || null,
              linkedin: row['LinkedIn / Réseaux sociaux'] || null,
            },
          });
          imported++;
        } catch (error) {
          console.error(`Erreur lors de l'importation de ${row['Prénom']} ${row['Nom']}:`, error);
        }
      }

      console.log(`Importation terminée ! ${imported} contacts importés.`);
      await prisma.$disconnect();
    });
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
