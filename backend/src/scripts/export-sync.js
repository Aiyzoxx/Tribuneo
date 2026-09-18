import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { geocodeAddress } from '../services/geocoding.js';

const prisma = new PrismaClient();

const determineTypeProcedure = (typeavis, famille, complement = '') => {
  const t = (typeavis + ' ' + famille + ' ' + complement).toLowerCase();
  if (t.includes('liquidation')) return 'liquidation';
  if (t.includes('redressement')) return 'redressement';
  if (t.includes('sauvegarde')) return 'sauvegarde';
  return 'autre';
};

async function run() {
  console.log('Downloading full 2026 export from ODSOFT...');
  const url = 'https://bodacc-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/annonces-commerciales/exports/json?where=(familleavis_lib:%22Proc%C3%A9dures+collectives%22+OR+familleavis_lib:%22Ventes+et+cessions%22)+AND+dateparution+%3E%3D+%222026-01-01%22';
  
  try {
    const response = await axios.get(url, { maxBodyLength: Infinity, maxContentLength: Infinity });
    const annonces = response.data;
    console.log(`Downloaded ${annonces.length} records!`);

    let newInserted = 0;
    let processed = 0;

    for (const annonce of annonces) {
      processed++;
      if (processed % 500 === 0) console.log(`Processed ${processed}/${annonces.length}...`);

      const numen = annonce.id;
      if (!numen) continue;

      const existing = await prisma.procedure.findUnique({ where: { numen } });
      if (existing) continue;

      let personneInfo = {};
      try {
        if (annonce.listepersonnes) {
          const listepersonnes = typeof annonce.listepersonnes === 'string' ? JSON.parse(annonce.listepersonnes) : annonce.listepersonnes;
          if (listepersonnes.personne) personneInfo = listepersonnes.personne;
          else if (Array.isArray(listepersonnes) && listepersonnes.length > 0) personneInfo = listepersonnes[0];
        }
      } catch (e) {}

      const raison_sociale = personneInfo.denomination || annonce.commercant || null;
      let siren = (personneInfo.numeroImmatriculation && personneInfo.numeroImmatriculation.numeroIdentification) ? personneInfo.numeroImmatriculation.numeroIdentification.replace(/\s/g, '') : null;
      if (!siren) siren = personneInfo.siren || null;
      
      const ville = annonce.ville ? annonce.ville.substring(0, 100) : null;
      const code_postal = annonce.cp ? String(annonce.cp).trim().substring(0, 5) : null;
      const departement = annonce.numerodepartement ? String(annonce.numerodepartement).trim().substring(0, 3) : null;
      
      let coords = null;
      try {
        coords = await geocodeAddress(`${code_postal || ''} ${ville || ''}`);
        await new Promise(r => setTimeout(r, 50)); // Prevent government API ban
      } catch(e) {}

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
        if (coords) {
          await prisma.$executeRaw`
            INSERT INTO procedures (numen, siren, raison_sociale, ville, code_postal, departement, type_procedure, date_jugement, tribunal, coordonnees)
            VALUES (
              ${numen.substring(0, 50)}, ${siren ? siren.substring(0, 9) : null}, ${raison_sociale ? raison_sociale.substring(0, 255) : null}, ${ville}, ${code_postal}, ${departement}, ${type_procedure.substring(0, 50)}, ${date_jugement}, ${annonce.tribunal ? annonce.tribunal.substring(0, 150) : null},
              ST_SetSRID(ST_MakePoint(${coords[0]}, ${coords[1]}), 4326)::geography
            ) ON CONFLICT (numen) DO NOTHING;
          `;
        } else {
          await prisma.$executeRaw`
            INSERT INTO procedures (numen, siren, raison_sociale, ville, code_postal, departement, type_procedure, date_jugement, tribunal)
            VALUES (
              ${numen.substring(0, 50)}, ${siren ? siren.substring(0, 9) : null}, ${raison_sociale ? raison_sociale.substring(0, 255) : null}, ${ville}, ${code_postal}, ${departement}, ${type_procedure.substring(0, 50)}, ${date_jugement}, ${annonce.tribunal ? annonce.tribunal.substring(0, 150) : null}
            ) ON CONFLICT (numen) DO NOTHING;
          `;
        }
        newInserted++;
      } catch (e) {
        console.error('Insert error', e.message);
      }
    }
    console.log(`Sync completed! Inserted ${newInserted} missing records out of ${annonces.length} total fetched.`);
  } catch (e) {
    console.error('Download error:', e.message);
  }
  process.exit(0);
}

run();
