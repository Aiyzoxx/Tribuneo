import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/suivis — Liste des procédures suivies par l'utilisateur connecté
router.get('/', async (req, res) => {
  try {
    const suivis = await prisma.suivi.findMany({
      where: { userId: req.user.id },
      include: {
        procedure: {
          select: {
            id: true,
            numen: true,
            siren: true,
            raison_sociale: true,
            type_procedure: true,
            date_jugement: true,
            ville: true,
            code_postal: true,
            tribunal: true,
          }
        }
      },
      orderBy: { created_at: 'desc' },
    });
    res.json({ suivis });
  } catch (err) {
    console.error('Erreur GET /suivis:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/suivis — Ajouter un suivi
router.post('/', async (req, res) => {
  const { procedureId } = req.body;
  if (!procedureId) return res.status(400).json({ error: 'procedureId requis.' });

  try {
    const suivi = await prisma.suivi.create({
      data: { userId: req.user.id, procedureId: Number(procedureId) },
    });
    res.status(201).json({ suivi });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Déjà dans vos suivis.' });
    }
    console.error('Erreur POST /suivis:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// DELETE /api/suivis/:procedureId — Retirer un suivi
router.delete('/:procedureId', async (req, res) => {
  const procedureId = Number(req.params.procedureId);
  try {
    await prisma.suivi.deleteMany({
      where: { userId: req.user.id, procedureId },
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Erreur DELETE /suivis:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/suivis/check/:procedureId — Vérifie si une procédure est suivie
router.get('/check/:procedureId', async (req, res) => {
  const procedureId = Number(req.params.procedureId);
  try {
    const suivi = await prisma.suivi.findUnique({
      where: { userId_procedureId: { userId: req.user.id, procedureId } },
    });
    res.json({ suivie: !!suivi });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

export default router;
