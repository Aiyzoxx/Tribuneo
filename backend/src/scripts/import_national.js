import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import csv from 'csv-parser';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

const BATCH_SIZE = 2000;
const CSV_PATH = '/app/annonces-commerciales.csv';

const determineTypeProcedure = (typeavis, famille) => {
  const t = (typeavis + ' ' + famille).toLowerCase();
  if (t.includes('liquidation')) return 'liquidation';
  if (t.includes('redressement')) return 'redressement';
  if (t.includes('sauvegarde')) return 'sauvegarde';
  return 'autre';
};

async function geocodeBatch(batch) {
  const tempCsvPath = path.join(__dirname, 'temp_batch_national.csv');
  let csvContent = 'id,adresse,postcode,city\n';
  
  for (const record of batch) {
    let personneInfo = {};
    try {
      if (record.listepersonnes) {
        personneInfo = JSON.parse(record.listepersonnes)[0] || {};
      }
    } catch (e) {}

    const adresse = personneInfo.adresse || '';
    const city = record.ville || '';
    const postcode = record.cp || '';
    
    const escapeCsv = (str) => `"${String(str).replace(/"/g, '""')}"`;
    
    const idStr = record.id || record['\uFEFFid'];
    csvContent += `${escapeCsv(idStr)},${escapeCsv(adresse)},${escapeCsv(postcode)},${escapeCsv(city)}\n`;
  }

  fs.writeFileSync(tempCsvPath, csvContent);

  const form = new FormData();
  form.append('data', fs.createReadStream(tempCsvPath));
  form.append('columns', 'adresse');
  form.append('columns', 'postcode');
  form.append('columns', 'city');
  form.append('postcode', 'postcode');
  form.append('citycode', 'city');

  try {
    const response = await axios.post('https://api-adresse.data.gouv.fr/search/csv/', form, {
      headers: { ...form.getHeaders() },
      responseType: 'stream'
    });

    const geocodedResults = {};
    
    await new Promise((resolve, reject) => {
      response.data
        .pipe(csv())
        .on('data', (data) => {
          geocodedResults[data.id] = {
            latitude: data.latitude,
            longitude: data.longitude
          };
        })
        .on('end', resolve)
        .on('error', reject);
    });

    fs.unlinkSync(tempCsvPath);
    return geocodedResults;
  } catch (error) {
    console.error('Erreur géocodage en masse:', error.message);
    if (fs.existsSync(tempCsvPath)) fs.unlinkSync(tempCsvPath);
    return {};
  }
}

async function insertBatch(batch, geocodedData) {
  let inserted = 0;
  for (const record of batch) {
    const numen = record.id || record['\uFEFFid'];
    if (!numen) continue;

    const geo = geocodedData[numen];
    const coords = geo && geo.longitude && geo.latitude ? [geo.longitude, geo.latitude] : null;

    let personneInfo = {};
    try {
      if (record.listepersonnes) {
        personneInfo = JSON.parse(record.listepersonnes)[0] || {};
      }
    } catch (e) {}

    const raison_sociale = personneInfo.denomination || record.commercant || null;
    const siren = personneInfo.siren || null;
    const forme_juridique = personneInfo.forme_juridique || null;
    
    let adresse = personneInfo.adresse ? personneInfo.adresse.substring(0, 500) : null;
    const ville = record.ville ? record.ville.substring(0, 100) : null;
    const code_postal = record.cp ? String(record.cp).trim().substring(0, 5) : null;
    const departement = record.numerodepartement ? String(record.numerodepartement).trim().substring(0, 3) : null;
    
    const type_procedure = determineTypeProcedure(record.typeavis_lib || '', record.familleavis_lib || '');
    const date_jugement = record.dateparution ? new Date(record.dateparution) : null;

    try {
      if (coords) {
        await prisma.$executeRaw`
          INSERT INTO procedures (numen, siren, raison_sociale, forme_juridique, adresse, ville, code_postal, departement, type_procedure, date_jugement, tribunal, liquidateur, coordonnees)
          VALUES (
            ${numen.substring(0, 50)}, ${siren ? siren.substring(0, 9) : null}, ${raison_sociale ? raison_sociale.substring(0, 255) : null}, ${forme_juridique ? forme_juridique.substring(0, 100) : null}, ${adresse}, ${ville}, ${code_postal}, ${departement}, ${type_procedure.substring(0, 50)}, ${date_jugement}, ${record.tribunal ? record.tribunal.substring(0, 150) : null}, ${null}, 
            ST_SetSRID(ST_MakePoint(${parseFloat(coords[0])}, ${parseFloat(coords[1])}), 4326)::geography
          )
          ON CONFLICT (numen) DO NOTHING;
        `;
      } else {
        await prisma.$executeRaw`
          INSERT INTO procedures (numen, siren, raison_sociale, forme_juridique, adresse, ville, code_postal, departement, type_procedure, date_jugement, tribunal, liquidateur)
          VALUES (
            ${numen.substring(0, 50)}, ${siren ? siren.substring(0, 9) : null}, ${raison_sociale ? raison_sociale.substring(0, 255) : null}, ${forme_juridique ? forme_juridique.substring(0, 100) : null}, ${adresse}, ${ville}, ${code_postal}, ${departement}, ${type_procedure.substring(0, 50)}, ${date_jugement}, ${record.tribunal ? record.tribunal.substring(0, 150) : null}, ${null}
          )
          ON CONFLICT (numen) DO NOTHING;
        `;
      }
      inserted++;
    } catch (e) {
      console.error(`Erreur insertion ${numen}:`, e.message);
    }
  }
  return inserted;
}

async function runNationalImport() {
  console.log('--- DÉMARRAGE IMPORTATION NATIONALE BODACC ---');
  console.log('Fichier cible:', CSV_PATH);
  
  // Date de filtrage: Il y a 6 mois
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const sixMonthsAgoStr = sixMonthsAgo.toISOString().split('T')[0];
  console.log(`Filtrage actif : Uniquement "Procédures collectives" depuis le ${sixMonthsAgoStr}`);

  let batch = [];
  let totalProcessed = 0;
  let totalValid = 0;
  let totalInserted = 0;

  try {
    if (!fs.existsSync(CSV_PATH)) {
      console.error("Le fichier n'a pas été trouvé au chemin indiqué !");
      process.exit(1);
    }

    const stream = fs.createReadStream(CSV_PATH)
      .pipe(csv({ separator: ';' }));

    for await (const row of stream) {
      totalProcessed++;
      
      // Afficher l'avancement
      if (totalProcessed % 50000 === 0) {
        console.log(`[Stream] Lignes lues : ${totalProcessed} ...`);
      }

      // Filter only liquidations and cessions
      const famille = row.familleavis_lib || '';
      if (!famille.includes('Procédures collectives')) {
        continue;
      }

      // Date filtering (must be within the last 6 months)
      if (!row.dateparution || row.dateparution < sixMonthsAgoStr) {
        continue;
      }
      
      batch.push(row);
      totalValid++;

      if (batch.length >= BATCH_SIZE) {
        stream.pause(); // Stop reading until batch is processed
        
        console.log(`=> Traitement d'un lot de ${batch.length} procédures (Lignes lues: ${totalProcessed})`);
        console.log(`Géocodage via api-adresse...`);
        const geocoded = await geocodeBatch(batch);
        
        console.log(`Insertion en base de données...`);
        const inserted = await insertBatch(batch, geocoded);
        totalInserted += inserted;
        
        console.log(`Progression: ${totalValid} dossiers gardés, ${totalInserted} insérés.`);
        
        batch = []; // Reset batch
        stream.resume(); // Continue reading
      }
    }

    if (batch.length > 0) {
      console.log(`Géocodage du dernier lot de ${batch.length} dossiers...`);
      const geocoded = await geocodeBatch(batch);
      console.log(`Insertion en base de données...`);
      const inserted = await insertBatch(batch, geocoded);
      totalInserted += inserted;
    }
    
    console.log('--- IMPORTATION NATIONALE TERMINÉE ---');
    console.log(`Bilan final : ${totalProcessed} lignes parcourues, ${totalValid} pertinentes, ${totalInserted} tentatives d'insertions réussies.`);
    process.exit(0);

  } catch (error) {
    console.error('Erreur globale:', error.message);
    process.exit(1);
  }
}

runNationalImport();
