import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { geocodeAddress } from '../services/geocoding.js';

const prisma = new PrismaClient();

const determineTypeProcedure = (typeavis, famille) => {
  const t = (typeavis + ' ' + famille).toLowerCase();
  if (t.includes('liquidation')) return 'liquidation';
  if (t.includes('redressement')) return 'redressement';
  if (t.includes('sauvegarde')) return 'sauvegarde';
  return 'autre';
};

async function run() {
  const url = 'https://bodacc-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/annonces-commerciales/records?where=id%3D%22A202600453386%22';
  const response = await axios.get(url);
  const annonce = response.data.results[0];
  
  if (!annonce) {
    console.log('Not found in API');
    return process.exit(1);
  }

  const numen = annonce.id;
  let personneInfo = {};
  if (annonce.listepersonnes) {
    const listepersonnes = typeof annonce.listepersonnes === 'string' ? JSON.parse(annonce.listepersonnes) : annonce.listepersonnes;
    if (listepersonnes.personne) personneInfo = listepersonnes.personne;
    if (Array.isArray(listepersonnes) && listepersonnes.length > 0) personneInfo = listepersonnes[0];
  }

  const raison_sociale = personneInfo.denomination || annonce.commercant || null;
  const siren = (personneInfo.numeroImmatriculation && personneInfo.numeroImmatriculation.numeroIdentification) ? personneInfo.numeroImmatriculation.numeroIdentification.replace(/\s/g, '') : null;
  
  const ville = annonce.ville || null;
  const code_postal = annonce.cp ? String(annonce.cp) : null;
  const departement = annonce.numerodepartement ? String(annonce.numerodepartement) : null;
  
  let coords = await geocodeAddress(`${code_postal || ''} ${ville || ''}`);
  
  let type_procedure = 'autre';
  if (annonce.jugement) {
    const j = typeof annonce.jugement === 'string' ? JSON.parse(annonce.jugement) : annonce.jugement;
    type_procedure = determineTypeProcedure(j.nature || '', j.famille || '');
  }

  const date_jugement = annonce.dateparution ? new Date(annonce.dateparution) : null;

  try {
    if (coords) {
      await prisma.$executeRaw`
        INSERT INTO procedures (numen, siren, raison_sociale, ville, code_postal, departement, type_procedure, date_jugement, tribunal, coordonnees)
        VALUES (
          ${numen}, ${siren}, ${raison_sociale}, ${ville}, ${code_postal}, ${departement}, ${type_procedure}, ${date_jugement}, ${annonce.tribunal},
          ST_SetSRID(ST_MakePoint(${coords[0]}, ${coords[1]}), 4326)::geography
        ) ON CONFLICT (numen) DO NOTHING;
      `;
    } else {
      await prisma.$executeRaw`
        INSERT INTO procedures (numen, siren, raison_sociale, ville, code_postal, departement, type_procedure, date_jugement, tribunal)
        VALUES (
          ${numen}, ${siren}, ${raison_sociale}, ${ville}, ${code_postal}, ${departement}, ${type_procedure}, ${date_jugement}, ${annonce.tribunal}
        ) ON CONFLICT (numen) DO NOTHING;
      `;
    }
    console.log('Inserted MB MENUISERIE!');
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
run();
