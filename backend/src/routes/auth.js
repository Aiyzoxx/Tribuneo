import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { google } from 'googleapis';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'tribuneo-secret-key-change-in-production';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://tribuneo.xyz';

// ─── Client OAuth2 Google ─────────────────────────────────────────────────────
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL || `${FRONTEND_URL}/api/auth/google/callback`
);

const SCOPES = ['openid', 'email', 'profile'];

// GET /api/auth/google — Redirige vers Google
router.get('/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'select_account',
  });
  res.redirect(url);
});

// GET /api/auth/google/callback — Callback de Google
router.get('/google/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error || !code) {
    return res.redirect(`${FRONTEND_URL}/?auth_error=cancelled`);
  }

  try {
    // Échange le code contre un token
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Récupère le profil utilisateur
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: profile } = await oauth2.userinfo.get();

    const { id: googleId, email, name, picture } = profile;

    // Crée ou retrouve l'utilisateur
    let user = await prisma.user.findFirst({
      where: { OR: [{ google_id: googleId }, { email }] }
    });

    if (!user) {
      // Nouvel utilisateur — auto-inscription
      user = await prisma.user.create({
        data: {
          email,
          nom: name,
          photo: picture,
          google_id: googleId,
          role: 'user',
        }
      });
    } else if (!user.google_id) {
      // Compte existant (email/mdp) → lie le compte Google
      user = await prisma.user.update({
        where: { id: user.id },
        data: { google_id: googleId, photo: picture, nom: user.nom || name }
      });
    }

    // Génère un JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, nom: user.nom, role: user.role, photo: user.photo },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirige vers le frontend avec le token
    res.redirect(`${FRONTEND_URL}/?token=${token}`);

  } catch (err) {
    console.error('Erreur Google OAuth:', err);
    res.redirect(`${FRONTEND_URL}/?auth_error=server_error`);
  }
});

// POST /api/auth/login — Connexion email/mdp (pour le compte admin)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.password) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, nom: user.nom, role: user.role, photo: user.photo },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, nom: user.nom, role: user.role, photo: user.photo }
    });
  } catch (err) {
    console.error('Erreur login:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/auth/register — Inscription email/mdp
router.post('/register', async (req, res) => {
  const { email, password, nom } = req.body;

  if (!email || !password || !nom) {
    return res.status(400).json({ error: 'Nom, email et mot de passe requis.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Un compte existe déjà avec cet email.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        nom,
        password: hashedPassword,
        role: 'user',
      }
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, nom: user.nom, role: user.role, photo: user.photo },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, nom: user.nom, role: user.role, photo: user.photo }
    });
  } catch (err) {
    console.error('Erreur register:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// PUT /api/auth/profile — Mise à jour du profil
router.put('/profile', authMiddleware, async (req, res) => {
  const { nom, email, currentPassword, newPassword } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    const updateData = {};

    // Mise à jour du nom
    if (nom && nom.trim()) updateData.nom = nom.trim();

    // Mise à jour de l'email
    if (email && email !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return res.status(409).json({ error: 'Cet email est déjà utilisé.' });
      updateData.email = email;
    }

    // Mise à jour du mot de passe
    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ error: 'Le mot de passe actuel est requis.' });
      if (!user.password) return res.status(400).json({ error: 'Impossible de changer le mot de passe d\'un compte Google.' });
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) return res.status(401).json({ error: 'Mot de passe actuel incorrect.' });
      if (newPassword.length < 8) return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' });
      updateData.password = await bcrypt.hash(newPassword, 12);
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: { id: true, email: true, nom: true, role: true, photo: true }
    });

    // Nouveau token avec les infos à jour
    const token = jwt.sign(
      { id: updated.id, email: updated.email, nom: updated.nom, role: updated.role, photo: updated.photo },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: updated });
  } catch (err) {
    console.error('Erreur update profile:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/auth/me — Vérifie le token
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, nom: true, role: true, photo: true }
    });

    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

export default router;

