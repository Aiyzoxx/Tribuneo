import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/directory-contacts
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search } = req.query;
    const userId = req.user.id;
    
    let whereClause = { userId: userId };
    
    if (search) {
      whereClause = {
        ...whereClause,
        OR: [
          { prenom: { contains: search, mode: 'insensitive' } },
          { nom: { contains: search, mode: 'insensitive' } },
          { entreprise: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    const contacts = await prisma.directoryContact.findMany({
      where: whereClause,
      orderBy: { nom: 'asc' }
    });
    
    res.json(contacts);
  } catch (error) {
    console.error('Erreur lors de la récupération des contacts directory:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/directory-contacts
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { prenom, nom, email, entreprise, titre_poste, telephone_mobile, telephone_fixe, ville, code_postal, linkedin, site_web } = req.body;

    const newContact = await prisma.directoryContact.create({
      data: {
        userId,
        prenom,
        nom,
        email,
        entreprise,
        titre_poste,
        telephone_mobile,
        telephone_fixe,
        ville,
        code_postal,
        linkedin,
        site_web
      }
    });

    res.status(201).json(newContact);
  } catch (error) {
    console.error('Erreur lors de la création du contact:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/directory-contacts/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const contactId = parseInt(req.params.id);
    const { prenom, nom, email, entreprise, titre_poste, telephone_mobile, telephone_fixe, ville, code_postal, linkedin, site_web } = req.body;

    // Vérifier que le contact appartient bien à l'utilisateur
    const existingContact = await prisma.directoryContact.findFirst({
      where: { id: contactId, userId: userId }
    });

    if (!existingContact) {
      return res.status(404).json({ error: 'Contact introuvable ou accès non autorisé' });
    }

    const updatedContact = await prisma.directoryContact.update({
      where: { id: contactId },
      data: {
        prenom, nom, email, entreprise, titre_poste, telephone_mobile, telephone_fixe, ville, code_postal, linkedin, site_web
      }
    });

    res.json(updatedContact);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du contact:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/directory-contacts/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const contactId = parseInt(req.params.id);

    // Vérifier que le contact appartient bien à l'utilisateur
    const existingContact = await prisma.directoryContact.findFirst({
      where: { id: contactId, userId: userId }
    });

    if (!existingContact) {
      return res.status(404).json({ error: 'Contact introuvable ou accès non autorisé' });
    }

    await prisma.directoryContact.delete({
      where: { id: contactId }
    });

    res.json({ message: 'Contact supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du contact:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
