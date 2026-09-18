import { PrismaClient } from '@prisma/client';
import csv from 'csv-parser';
import fs from 'fs';

const prisma = new PrismaClient();

const determineTypeProcedure = (jugementStr, familleStr) => {
  const t = (jugementStr + ' ' + familleStr).toLowerCase();
  if (t.includes('liquidation')) return 'liquidation';
  if (t.includes('redressement')) return 'redressement';
  if (t.includes('sauvegarde')) return 'sauvegarde';
  return 'autre';
};

async function repairNationalTypes() {
  console.log('Démarrage de la réparation des types de procédure nationaux...');
  const csvPath = '/app/annonces-commerciales.csv';
  
  if (!fs.existsSync(csvPath)) {
    console.error("Le fichier " + csvPath + " n'a pas été trouvé !");
    process.exit(1);
  }

  let batch = [];
  let processed = 0;
  let updated = 0;

  const executeBatch = async (items) => {
    if (items.length === 0) return;
    try {
      const queries = items.map(item => 
        prisma.$executeRaw`UPDATE procedures SET type_procedure = ${item.type_procedure} WHERE numen = ${item.numen} AND type_procedure != ${item.type_procedure}`
      );
      const results = await prisma.$transaction(queries);
      updated += results.reduce((acc, val) => acc + val, 0);
    } catch (e) {
      console.error('Erreur lors du batch:', e.message);
    }
  };

  const stream = fs.createReadStream(csvPath).pipe(csv({ separator: ';' }));

  for await (const row of stream) {
    const famille = row.familleavis_lib || '';
    if (!famille.includes('Procédures collectives')) {
      continue;
    }

    const numen = row.id || row['\uFEFFid'];
    if (!numen) continue;

    const jugement = row.jugement || '';
    const newType = determineTypeProcedure(jugement, famille);
    
    batch.push({ numen: numen.substring(0, 50), type_procedure: newType });
    processed++;

    if (batch.length >= 1000) {
      await executeBatch(batch);
      console.log(`Progression: ${processed} analysés, ${updated} mis à jour...`);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await executeBatch(batch);
  }

  console.log(`Réparation terminée. ${processed} enregistrements analysés, ${updated} mis à jour au total.`);
  process.exit(0);
}

repairNationalTypes();
