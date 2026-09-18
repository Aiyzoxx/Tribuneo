import express from 'express';
import { PrismaClient, Prisma } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/search', async (req, res) => {
  try {
    const { lat, lon, radius, type, months, companyName } = req.query;

    const isGlobalSearch = !lat || !lon;

    let sirenFilter = null;
    let companyFilter = null;
    if (companyName) {
      const cleanSiren = companyName.replace(/\s+/g, '');
      if (/^\d{9}$/.test(cleanSiren)) {
        sirenFilter = cleanSiren;
      } else {
        companyFilter = `%${companyName}%`;
      }
    }

    if (isGlobalSearch && !companyFilter && !sirenFilter) {
      return res.status(400).json({ error: 'Les paramètres lat et lon, ou un nom/SIREN sont requis' });
    }

    const radiusMeters = (parseFloat(radius) || 35) * 1000;
    const monthsFilter = parseInt(months, 10) || 0;

    let typeConditions = Prisma.empty;
    if (type && type !== 'tous') {
      const typesArray = type.split(',');
      if (typesArray.length > 0) {
        typeConditions = Prisma.sql`AND type_procedure IN (${Prisma.join(typesArray)})`;
      }
    }

    let monthsCondition = Prisma.empty;
    if (monthsFilter > 0) {
      monthsCondition = Prisma.sql`AND date_jugement >= CURRENT_DATE - (${monthsFilter}::text || ' months')::interval`;
    }

    let companyCondition = Prisma.empty;
    if (companyFilter) {
      companyCondition = Prisma.sql`AND raison_sociale ILIKE ${companyFilter}`;
    }

    let sirenCondition = Prisma.empty;
    if (sirenFilter) {
      sirenCondition = Prisma.sql`AND siren = ${sirenFilter}`;
    }

    const query = isGlobalSearch ? prisma.$queryRaw`
      SELECT id, numen, siren, raison_sociale, forme_juridique, adresse, ville, code_postal, type_procedure, date_jugement, tribunal, liquidateur, lien_bodacc,
             ST_X(coordonnees::geometry) as lon, ST_Y(coordonnees::geometry) as lat,
             NULL AS distance_m
      FROM procedures
      WHERE 1=1
      ${typeConditions}
      ${monthsCondition}
      ${companyCondition}
      ${sirenCondition}
      ORDER BY date_jugement DESC NULLS LAST
      LIMIT 1000;
    ` : prisma.$queryRaw`
      SELECT id, numen, siren, raison_sociale, forme_juridique, adresse, ville, code_postal, type_procedure, date_jugement, tribunal, liquidateur, lien_bodacc,
             ST_X(coordonnees::geometry) as lon, ST_Y(coordonnees::geometry) as lat,
             ST_Distance(coordonnees, ST_SetSRID(ST_MakePoint(${parseFloat(lon)}, ${parseFloat(lat)}), 4326)::geography) AS distance_m
      FROM procedures
      WHERE ST_DWithin(coordonnees, ST_SetSRID(ST_MakePoint(${parseFloat(lon)}, ${parseFloat(lat)}), 4326)::geography, ${radiusMeters})
      ${typeConditions}
      ${monthsCondition}
      ${companyCondition}
      ${sirenCondition}
      ORDER BY date_jugement DESC NULLS LAST, distance_m ASC
      LIMIT 1000;
    `;

    const results = await query;
    res.json(results);
  } catch (error) {
    console.error('Erreur lors de la recherche:', error);
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
});

router.get('/entreprise/:siren', async (req, res) => {
  try {
    const procedures = await prisma.procedure.findMany({
      where: { siren: req.params.siren }
    });
    res.json(procedures);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
});

export default router;
