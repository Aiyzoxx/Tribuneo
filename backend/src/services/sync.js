import { PrismaClient } from '@prisma/client';
import { fetchBodaccAnnonces } from './bodacc.js';
import { geocodeAddress } from './geocoding.js';
import { sendGeographicAlert } from './emailService.js';

const prisma = new PrismaClient();

const determineTypeProcedure = (typeavis, famille, complement = '') => {
  const t = (typeavis + ' ' + famille + ' ' + complement).toLowerCase();
  if (t.includes('liquidation')) return 'liquidation';
  if (t.includes('redressement')) return 'redressement';
  if (t.includes('sauvegarde')) return 'sauvegarde';
  return 'autre';
};

export const syncBodaccData = async (dateSince = null) => {
  let offset = 0;
  const limit = 100;
  let hasMore = true;
  let totalProcessed = 0;
  let newInserted = 0;

  console.log(`Starting BODACC sync${dateSince ? ' since ' + dateSince : ''}...`);

  while (hasMore) {
    console.log(`Fetching from BODACC (offset ${offset})...`);
    const data = await fetchBodaccAnnonces(limit, offset, dateSince);
    
    if (!data.results || data.results.length === 0) {
      hasMore = false;
      break;
    }

    const annonces = data.results;
    
    for (const annonce of annonces) {
      const numen = annonce.id;
      if (!numen) continue;

      // Check if already exists
      const existing = await prisma.procedure.findUnique({
        where: { numen }
      });
      
      if (existing) continue;

      let personneInfo = {};
      try {
        if (annonce.listepersonnes) {
          const listepersonnes = typeof annonce.listepersonnes === 'string' 
            ? JSON.parse(annonce.listepersonnes) 
            : annonce.listepersonnes;
          if (listepersonnes.length > 0) {
            personneInfo = listepersonnes[0];
          }
        }
      } catch (e) {
        console.error('Failed to parse listepersonnes for numen', numen);
      }

      const raison_sociale = personneInfo.denomination || annonce.commercant || null;
      const siren = personneInfo.siren || null;
      const forme_juridique = personneInfo.forme_juridique || null;
      
      let adresse = personneInfo.adresse ? personneInfo.adresse.substring(0, 500) : null;
      const ville = annonce.ville ? annonce.ville.substring(0, 100) : null;
      const code_postal = annonce.cp ? String(annonce.cp).trim().substring(0, 5) : null;
      const departement = annonce.numerodepartement ? String(annonce.numerodepartement).trim().substring(0, 3) : null;
      
      let fullAddressForGeocoding = null;
      if (adresse) {
        fullAddressForGeocoding = `${adresse}, ${code_postal || ''} ${ville || ''}`.trim();
      } else if (ville) {
        fullAddressForGeocoding = `${code_postal || ''} ${ville}`.trim();
      }

      let coords = await geocodeAddress(fullAddressForGeocoding);

      let type_procedure = 'autre';
      if (annonce.jugement) {
        try {
          const j = typeof annonce.jugement === 'string' ? JSON.parse(annonce.jugement) : annonce.jugement;
          type_procedure = determineTypeProcedure(j.nature || '', j.famille || '', j.complementJugement || '');
        } catch(e){}
      } else {
        type_procedure = determineTypeProcedure(annonce.typeavis_lib || '', annonce.familleavis_lib || '');
      }
      const date_jugement = annonce.dateparution ? new Date(annonce.dateparution) : null;

      try {
        let insertQuery;
        
        if (coords) {
          insertQuery = prisma.$executeRaw`
            INSERT INTO procedures (numen, siren, raison_sociale, forme_juridique, adresse, ville, code_postal, departement, type_procedure, date_jugement, tribunal, liquidateur, coordonnees)
            VALUES (
              ${numen.substring(0, 50)}, ${siren ? siren.substring(0, 9) : null}, ${raison_sociale ? raison_sociale.substring(0, 255) : null}, ${forme_juridique ? forme_juridique.substring(0, 100) : null}, ${adresse}, ${ville}, ${code_postal}, ${departement}, ${type_procedure.substring(0, 50)}, ${date_jugement}, ${annonce.tribunal ? annonce.tribunal.substring(0, 150) : null}, ${null},
              ST_SetSRID(ST_MakePoint(${coords[0]}, ${coords[1]}), 4326)::geography
            )
            ON CONFLICT (numen) DO NOTHING;
          `;
        } else {
          insertQuery = prisma.$executeRaw`
            INSERT INTO procedures (numen, siren, raison_sociale, forme_juridique, adresse, ville, code_postal, departement, type_procedure, date_jugement, tribunal, liquidateur)
            VALUES (
              ${numen.substring(0, 50)}, ${siren ? siren.substring(0, 9) : null}, ${raison_sociale ? raison_sociale.substring(0, 255) : null}, ${forme_juridique ? forme_juridique.substring(0, 100) : null}, ${adresse}, ${ville}, ${code_postal}, ${departement}, ${type_procedure.substring(0, 50)}, ${date_jugement}, ${annonce.tribunal ? annonce.tribunal.substring(0, 150) : null}, ${null}
            )
            ON CONFLICT (numen) DO NOTHING;
          `;
        }
        
        const rows = await insertQuery;
        if (rows > 0) {
          newInserted++;
          
          if (coords) {
            const companyName = raison_sociale || 'Entreprise Inconnue';
            
            try {
              // Requête spatiale (PostGIS) pour trouver les alertes qui englobent l'entreprise
              const matchingAlerts = await prisma.$queryRaw`
                SELECT u.email, a.ville, a.rayon_km
                FROM alertes a
                JOIN users u ON a."userId" = u.id
                WHERE a.active = true
                AND ST_DWithin(
                  ST_SetSRID(ST_MakePoint(a.lng, a.lat), 4326)::geography,
                  ST_SetSRID(ST_MakePoint(${coords[0]}, ${coords[1]}), 4326)::geography,
                  a.rayon_km * 1000
                )
              `;
              
              // Envoi des emails à tous les utilisateurs concernés
              for (const alert of matchingAlerts) {
                sendGeographicAlert(alert.email, companyName, type_procedure, alert.ville).catch(console.error);
              }
            } catch (geoError) {
              console.error('Erreur lors de la recherche des alertes géographiques:', geoError);
            }
          }
        }
      } catch (e) {
        console.error(`Error inserting procedure ${numen}:`, e.message);
      }
    }

    totalProcessed += annonces.length;
    offset += limit;

    if (totalProcessed >= data.total_count) {
      hasMore = false;
    }
  }

  console.log(`Sync completed. Processed: ${totalProcessed}, Inserted: ${newInserted}`);
  return { processed: totalProcessed, inserted: newInserted };
};
