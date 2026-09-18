import { PrismaClient } from '@prisma/client';
import { geocodeCascade } from '../services/geocoding.js';

const prisma = new PrismaClient();

async function run() {
  console.log('--- DÉMARRAGE DU RATTRAPAGE MASSIF EN CASCADE ---');
  let totalProcessed = 0;
  let totalUpdated = 0;

  const BATCH_SIZE = 100;

  while (true) {
    const procedures = await prisma.$queryRaw`
      SELECT id, numen, siren, adresse, code_postal, ville 
      FROM procedures 
      WHERE precision_geo IS NULL
      AND (adresse IS NOT NULL OR code_postal IS NOT NULL)
      LIMIT ${BATCH_SIZE};
    `;

    if (procedures.length === 0) {
      console.log('Aucun dossier supplémentaire à traiter.');
      break;
    }

    for (const proc of procedures) {
      try {
        const result = await geocodeCascade(proc.siren, proc.adresse, proc.code_postal, proc.ville);
        
        if (result) {
          await prisma.$executeRaw`
            UPDATE procedures
            SET precision_geo = ${result.precision},
                coordonnees = ST_SetSRID(ST_MakePoint(${result.coords[0]}, ${result.coords[1]}), 4326)::geography,
                updated_at = NOW()
            WHERE id = ${proc.id};
          `;
          totalUpdated++;
        } else {
          // Marquer comme 'introuvable' pour ne pas le retraiter infiniment
          await prisma.$executeRaw`
            UPDATE procedures
            SET precision_geo = 'introuvable',
                updated_at = NOW()
            WHERE id = ${proc.id};
          `;
        }
      } catch (err) {
        console.error(`Erreur sur ID ${proc.id}:`, err.message);
      }
      
      totalProcessed++;
      if (totalProcessed % 100 === 0) {
        console.log(`Progression : ${totalProcessed} dossiers traités (${totalUpdated} mis à jour avec coordonnées).`);
      }
    }
  }

  console.log('--- RATTRAPAGE TERMINÉ ---');
  await prisma.$disconnect();
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
