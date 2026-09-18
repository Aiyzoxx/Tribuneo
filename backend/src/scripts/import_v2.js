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
  const tempCsvPath = path.join(__dirname, 'temp_batch_import.csv');
  let csvContent = 'id,adresse,postcode,city\n';
  
  for (const record of batch) {
    const city = record.ville || '';
    const postcode = record.cp || '';
    
    const escapeCsv = (str) => `"${String(str || '').replace(/"/g, '""')}"`;
    const idStr = record.id || record['\uFEFFid'];
    csvContent += `${escapeCsv(idStr)},${escapeCsv(record.extracted_adresse)},${escapeCsv(postcode)},${escapeCsv(city)}\n`;
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
            longitude: data.longitude,
            result_type: data.result_type
          };
        })
        .on('end', resolve)
        .on('error', reject);
    });

    if (fs.existsSync(tempCsvPath)) fs.unlinkSync(tempCsvPath);
    return geocodedResults;
  } catch (error) {
    console.error('Erreur géocodage en masse (BAN):', error.message);
    if (fs.existsSync(tempCsvPath)) fs.unlinkSync(tempCsvPath);
    return {};
  }
}

async function processBatch(batch) {
  // Extraire les infos propres
  for (const record of batch) {
    let personneInfo = {};
    try {
      if (record.listepersonnes) {
        let parsed = JSON.parse(record.listepersonnes);
        if (Array.isArray(parsed)) {
          personneInfo = parsed[0] || {};
          if (personneInfo.personne) personneInfo = personneInfo.personne;
        } else {
          personneInfo = parsed.personne || parsed;
        }
      }
    } catch (e) {}

    let siren = null;
    if (personneInfo.numeroImmatriculation && personneInfo.numeroImmatriculation.numeroIdentification) {
      siren = personneInfo.numeroImmatriculation.numeroIdentification.replace(/\s/g, '');
    } else if (personneInfo.siren) {
      siren = personneInfo.siren.replace(/\s/g, '');
    }
    record.extracted_siren = siren;

    let adresseStr = null;
    if (personneInfo.adresseSiegeSocial) {
      const adr = personneInfo.adresseSiegeSocial;
      adresseStr = [adr.numeroVoie, adr.typeVoie, adr.nomVoie].filter(Boolean).join(' ').trim();
      if (!adresseStr) adresseStr = adr.adresse || null;
    } else if (personneInfo.adresse) {
      adresseStr = personneInfo.adresse;
    }
    record.extracted_adresse = adresseStr ? adresseStr.substring(0, 500) : null;
    
    record.extracted_forme = (personneInfo.formeJuridique || personneInfo.forme_juridique || null)?.substring(0, 100);
    record.extracted_raison = (personneInfo.denomination || record.commercant || null)?.substring(0, 255);
  }

  // Géocodage
  const geocoded = await geocodeBatch(batch);

  let inserted = 0;

  for (const record of batch) {
    const numen = record.id || record['\uFEFFid'];
    if (!numen) continue;

    const geo = geocoded[numen];
    let coords = null;

    if (geo && geo.longitude && geo.latitude) {
      coords = [parseFloat(geo.longitude), parseFloat(geo.latitude)];
    }

    const type_procedure = determineTypeProcedure(record.typeavis_lib || '', record.familleavis_lib || '');
    const date_jugement = record.dateparution ? new Date(record.dateparution) : null;
    const ville = record.ville ? record.ville.substring(0, 100) : null;
    const code_postal = record.cp ? String(record.cp).trim().substring(0, 5) : null;
    const departement = record.numerodepartement ? String(record.numerodepartement).trim().substring(0, 3) : null;

    try {
      if (coords) {
        await prisma.$executeRaw`
          INSERT INTO procedures (numen, siren, raison_sociale, forme_juridique, adresse, ville, code_postal, departement, type_procedure, date_jugement, tribunal, liquidateur, coordonnees)
          VALUES (
            ${numen.substring(0, 50)}, ${record.extracted_siren ? record.extracted_siren.substring(0, 9) : null}, ${record.extracted_raison}, ${record.extracted_forme}, ${record.extracted_adresse}, ${ville}, ${code_postal}, ${departement}, ${type_procedure.substring(0, 50)}, ${date_jugement}, ${record.tribunal ? record.tribunal.substring(0, 150) : null}, ${null}, 
            ST_SetSRID(ST_MakePoint(${coords[0]}, ${coords[1]}), 4326)::geography
          )
          ON CONFLICT (numen) DO NOTHING;
        `;
      } else {
        await prisma.$executeRaw`
          INSERT INTO procedures (numen, siren, raison_sociale, forme_juridique, adresse, ville, code_postal, departement, type_procedure, date_jugement, tribunal, liquidateur)
          VALUES (
            ${numen.substring(0, 50)}, ${record.extracted_siren ? record.extracted_siren.substring(0, 9) : null}, ${record.extracted_raison}, ${record.extracted_forme}, ${record.extracted_adresse}, ${ville}, ${code_postal}, ${departement}, ${type_procedure.substring(0, 50)}, ${date_jugement}, ${record.tribunal ? record.tribunal.substring(0, 150) : null}, ${null}
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

async function runImport() {
  console.log('--- DÉMARRAGE DE L\'IMPORTATION V2 (PARSING PROFOND) ---');
  console.log('Fichier cible:', CSV_PATH);
  
  // Les données s'arrêtent vers janvier 2025, donc "6 mois" par rapport à juin 2026 ne marche pas.
  // On prend une date fixe pour importer une bonne tranche récente.
  const targetDateStr = '2024-06-01';

  let batch = [];
  let totalProcessed = 0;
  let totalValid = 0;
  let totalInserted = 0;

  try {
    if (!fs.existsSync(CSV_PATH)) {
      console.error("Le fichier CSV n'a pas été trouvé !");
      process.exit(1);
    }

    const stream = fs.createReadStream(CSV_PATH).pipe(csv({ separator: ';' }));

    for await (const row of stream) {
      totalProcessed++;
      
      if (totalProcessed % 100000 === 0) {
        console.log(`[Stream] Lignes lues : ${totalProcessed} ...`);
      }
      
      const famille = row.familleavis_lib || '';
      if (!famille.includes('Procédures collectives')) continue;
      if (!row.dateparution || row.dateparution < targetDateStr) continue;
      
      batch.push(row);
      totalValid++;

      if (batch.length >= BATCH_SIZE) {
        stream.pause();
        console.log(`\n=> Traitement d'un lot de ${batch.length} (Lignes lues: ${totalProcessed})`);
        
        const inserted = await processBatch(batch);
        totalInserted += inserted;
        
        console.log(`   Progression: ${totalInserted} dossiers insérés avec géocodage complet.`);
        
        batch = [];
        stream.resume();
      }
    }

    if (batch.length > 0) {
      console.log(`\n=> Traitement du dernier lot de ${batch.length}`);
      const inserted = await processBatch(batch);
      totalInserted += inserted;
    }
    
    console.log('--- IMPORTATION V2 TERMINÉE ---');
    console.log(`Bilan final : ${totalProcessed} lignes lues, ${totalInserted} dossiers proprement importés.`);
    process.exit(0);

  } catch (error) {
    console.error('Erreur globale:', error.message);
    process.exit(1);
  }
}

runImport();
