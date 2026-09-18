import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/contacts/:procedureId — Liste des contacts pour une procédure
router.get('/:procedureId', async (req, res) => {
  const procedureId = Number(req.params.procedureId);
  try {
    const contacts = await prisma.contact.findMany({
      where: { userId: req.user.id, procedureId },
      orderBy: { date_contact: 'desc' },
    });
    res.json({ contacts });
  } catch (err) {
    console.error('Erreur GET /contacts:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/contacts — Créer un contact
router.post('/', async (req, res) => {
  const { procedureId, interlocuteur, note, date_contact } = req.body;
  if (!procedureId) return res.status(400).json({ error: 'procedureId requis.' });

  try {
    const contact = await prisma.contact.create({
      data: {
        userId: req.user.id,
        procedureId: Number(procedureId),
        interlocuteur: interlocuteur?.trim() || null,
        note: note?.trim() || null,
        date_contact: date_contact ? new Date(date_contact) : new Date(),
      },
    });
    res.status(201).json({ contact });
  } catch (err) {
    console.error('Erreur POST /contacts:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// DELETE /api/contacts/:id — Supprimer un contact
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    // Vérifie que le contact appartient à l'utilisateur
    const contact = await prisma.contact.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!contact) return res.status(404).json({ error: 'Contact introuvable.' });

    await prisma.contact.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error('Erreur DELETE /contacts:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

export default router;
