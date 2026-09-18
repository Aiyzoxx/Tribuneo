import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

async function runFastRepair() {
  console.log('--- DÉMARRAGE RÉPARATION ULTRA-RAPIDE ---');
  try {
    // 1. Récupérer toutes les villes uniques qui n'ont pas de coordonnées
    const uniqueCities = await prisma.$queryRaw`
      SELECT DISTINCT code_postal, ville 
      FROM procedures 
      WHERE coordonnees IS NULL AND ville IS NOT NULL AND ville != ''
    `;

    console.log(`Trouvé ${uniqueCities.length} villes uniques à géocoder.`);

    let geocodedCount = 0;
    
    // 2. Géocoder chaque ville unique (environ 250 requêtes, ça prend 5 secondes)
    for (const city of uniqueCities) {
      const query = `${city.code_postal} ${city.ville}`.trim();
      try {
        const res = await axios.get(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=1`);
        
        if (res.data && res.data.features && res.data.features.length > 0) {
          const coords = res.data.features[0].geometry.coordinates; // [lon, lat]
          const lon = coords[0];
          const lat = coords[1];

          // 3. Mettre à jour TOUTES les entreprises de cette ville d'un seul coup
          const result = await prisma.$executeRaw`
            UPDATE procedures 
            SET coordonnees = ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography 
            WHERE coordonnees IS NULL AND code_postal = ${city.code_postal} AND ville = ${city.ville}
          `;
          
          geocodedCount++;
          if (geocodedCount % 50 === 0) {
            console.log(`Progression : ${geocodedCount}/${uniqueCities.length} villes géocodées.`);
          }
        } else {
          console.log(`Introuvable : ${query}`);
        }
      } catch (err) {
        console.error(`Erreur API pour ${query} :`, err.message);
      }
      
      // Pause de 50ms pour ne pas spammer l'API
      await new Promise(r => setTimeout(r, 50));
    }

    console.log(`--- RÉPARATION TERMINÉE AVEC SUCCÈS ---`);
    process.exit(0);

  } catch (error) {
    console.error('Erreur globale:', error.message);
    process.exit(1);
  }
}

runFastRepair();
