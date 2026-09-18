import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/alertes — Liste des alertes de l'utilisateur
router.get('/', async (req, res) => {
  try {
    const alertes = await prisma.alerte.findMany({
      where: { userId: req.user.id },
      orderBy: { created_at: 'desc' },
    });
    res.json({ alertes });
  } catch (err) {
    console.error('Erreur GET /alertes:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/alertes — Créer une alerte
router.post('/', async (req, res) => {
  const { ville, rayon_km, lat, lng } = req.body;
  if (!ville || lat == null || lng == null) {
    return res.status(400).json({ error: 'ville, lat et lng requis.' });
  }

  try {
    const alerte = await prisma.alerte.create({
      data: {
        userId: req.user.id,
        ville: ville.trim(),
        rayon_km: Number(rayon_km) || 30,
        lat: Number(lat),
        lng: Number(lng),
        active: true,
      },
    });
    res.status(201).json({ alerte });
  } catch (err) {
    console.error('Erreur POST /alertes:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// PATCH /api/alertes/:id — Activer / désactiver une alerte
router.patch('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { active } = req.body;

  try {
    const alerte = await prisma.alerte.findFirst({ where: { id, userId: req.user.id } });
    if (!alerte) return res.status(404).json({ error: 'Alerte introuvable.' });

    const updated = await prisma.alerte.update({
      where: { id },
      data: { active: Boolean(active) },
    });
    res.json({ alerte: updated });
  } catch (err) {
    console.error('Erreur PATCH /alertes:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// DELETE /api/alertes/:id — Supprimer une alerte
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const alerte = await prisma.alerte.findFirst({ where: { id, userId: req.user.id } });
    if (!alerte) return res.status(404).json({ error: 'Alerte introuvable.' });

    await prisma.alerte.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error('Erreur DELETE /alertes:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

export default router;
