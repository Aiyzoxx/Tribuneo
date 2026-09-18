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
const BATCH_SIZE = 2000; // Bulk process fast

async function geocodeBatch(batch) {
  const tempCsvPath = path.join(__dirname, `temp_repair_${Date.now()}.csv`);
  let csvContent = 'id,adresse,postcode,city\n';
  
  for (const record of batch) {
    const escapeCsv = (str) => `"${String(str || '').replace(/"/g, '""')}"`;
    const searchAddress = `${record.adresse || ''} ${record.code_postal || ''} ${record.ville || ''}`.trim();
    csvContent += `${escapeCsv(record.id)},${escapeCsv(searchAddress)},${escapeCsv(record.code_postal)},${escapeCsv(record.ville)}\n`;
  }

  fs.writeFileSync(tempCsvPath, csvContent);

  const form = new FormData();
  form.append('data', fs.createReadStream(tempCsvPath));
  form.append('columns', 'adresse');

  try {
    const response = await axios.post('https://api-adresse.data.gouv.fr/search/csv/', form, {
      headers: { ...form.getHeaders() },
      responseType: 'stream'
    });

    const geocodedResults = {};
    let firstRow = true;
    
    await new Promise((resolve, reject) => {
      response.data
        .pipe(csv())
        .on('data', (data) => {
          if (firstRow) {
            console.log('Première ligne retournée:', data);
            firstRow = false;
          }
          // The API sometimes prepends BOM or changes the header
          const idKey = Object.keys(data).find(k => k.trim().replace(/^\uFEFF/, '') === 'id');
          const id = data[idKey];
          
          if (id && data.latitude && data.longitude) {
            geocodedResults[id] = {
              latitude: parseFloat(data.latitude),
              longitude: parseFloat(data.longitude)
            };
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    if (fs.existsSync(tempCsvPath)) fs.unlinkSync(tempCsvPath);
    return geocodedResults;
  } catch (error) {
    console.error('Erreur géocodage:', error.message);
    if (fs.existsSync(tempCsvPath)) fs.unlinkSync(tempCsvPath);
    return {};
  }
}

async function runRepair() {
  console.log('--- DÉMARRAGE RÉPARATION COORDONNÉES ---');
  
  try {
    const totalToRepairRes = await prisma.$queryRaw`SELECT COUNT(*) FROM procedures WHERE coordonnees IS NULL AND ville IS NOT NULL AND ville != ''`;
    const totalToRepair = Number(totalToRepairRes[0].count);
    console.log(`${totalToRepair} dossiers à réparer.`);

    if (totalToRepair === 0) {
      console.log('Rien à réparer !');
      process.exit(0);
    }

    let processed = 0;
    let updated = 0;

    while (true) {
      // Fetch batch
      const batch = await prisma.$queryRaw`
        SELECT id, adresse, code_postal, ville, numen 
        FROM procedures 
        WHERE coordonnees IS NULL AND ville IS NOT NULL AND ville != ''
        LIMIT ${BATCH_SIZE}
      `;

      if (batch.length === 0) break;

      console.log(`Géocodage d'un lot de ${batch.length}...`);
      const geocoded = await geocodeBatch(batch);
      
      let batchUpdated = 0;
      for (const record of batch) {
        const geo = geocoded[record.id];
        if (geo && !isNaN(geo.longitude) && !isNaN(geo.latitude)) {
          await prisma.$executeRaw`
            UPDATE procedures 
            SET coordonnees = ST_SetSRID(ST_MakePoint(${geo.longitude}, ${geo.latitude}), 4326)::geography 
            WHERE id = ${record.id}
          `;
          batchUpdated++;
        }
      }
      
      updated += batchUpdated;
      processed += batch.length;
      console.log(`Lot terminé : ${batchUpdated} coordonnées mises à jour. Total : ${processed}/${totalToRepair}`);
    }

    console.log(`--- RÉPARATION TERMINÉE : ${updated} mis à jour ---`);
    process.exit(0);

  } catch (error) {
    console.error('Erreur globale:', error.message);
    process.exit(1);
  }
}

runRepair();
