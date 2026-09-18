import { PrismaClient } from '@prisma/client';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

const determineTypeProcedure = (jugementStr, familleStr) => {
  const t = (jugementStr + ' ' + familleStr).toLowerCase();
  if (t.includes('liquidation')) return 'liquidation';
  if (t.includes('redressement')) return 'redressement';
  if (t.includes('sauvegarde')) return 'sauvegarde';
  return 'autre';
};

async function repairTypes() {
  console.log('Démarrage de la réparation des types de procédure...');
  const csvPath = '/app/annonces-commerciales.csv';
  
  if (!fs.existsSync(csvPath)) {
    console.error("Le fichier CSV n'a pas été trouvé !");
    process.exit(1);
  }

  // Pre-load all numen from DB
  console.log("Chargement des Numen en mémoire...");
  const records = await prisma.$queryRaw`SELECT numen FROM procedures WHERE type_procedure = 'autre'`;
  const existingNumen = new Set(records.map(r => r.numen));
  console.log(`${existingNumen.size} dossiers à vérifier.`);

  if (existingNumen.size === 0) {
    console.log("Rien à réparer.");
    process.exit(0);
  }

  let batch = [];
  let processed = 0;
  let updated = 0;

  const executeBatch = async (items) => {
    if (items.length === 0) return;
    try {
      const queries = items.map(item => 
        prisma.$executeRaw`UPDATE procedures SET type_procedure = ${item.type_procedure} WHERE numen = ${item.numen}`
      );
      const results = await prisma.$transaction(queries);
      updated += results.reduce((acc, val) => acc + val, 0);
    } catch (e) {
      console.error('Erreur lors du batch:', e.message);
    }
  };

  const stream = fs.createReadStream(csvPath).pipe(csv({ separator: ';' }));

  for await (const row of stream) {
    processed++;
    if (processed % 500000 === 0) console.log(`[Stream] Lignes lues : ${processed} ...`);

    const numen = row.id || row['\uFEFFid'];
    if (!numen || !existingNumen.has(numen)) continue;
    
    const famille = row.familleavis_lib || '';
    const jugement = row.jugement || '';
    
    const newType = determineTypeProcedure(jugement, famille);
    
    if (newType !== 'autre') {
      batch.push({ numen: numen.substring(0, 50), type_procedure: newType });
      // Remove from set to avoid duplicate work if duplicate rows
      existingNumen.delete(numen);
    }

    if (batch.length >= 2000) {
      await executeBatch(batch);
      console.log(`Progression: ${updated} mis à jour...`);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await executeBatch(batch);
  }

  console.log(`Réparation terminée. ${processed} enregistrements analysés, ${updated} mis à jour au total.`);
  process.exit(0);
}

repairTypes();
