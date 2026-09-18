import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import searchRoutes from './routes/search.js';
import aiRoutes from './routes/ai.js';
import authRoutes from './routes/auth.js';
import suivisRoutes from './routes/suivis.js';
import contactsRoutes from './routes/contacts.js';
import alertesRoutes from './routes/alertes.js';
import directoryContactsRoutes from './routes/directoryContacts.js';
import { authMiddleware } from './middleware/auth.js';
import { syncBodaccData } from './services/sync.js';
import { setupCron } from './cron/nightly.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes publiques (pas de token requis)
app.use('/api/auth', authRoutes);
app.use('/api/directory-contacts', directoryContactsRoutes); // Publique pour l'instant


// Routes protégées (token JWT requis)
app.use('/api', authMiddleware, searchRoutes);
app.use('/api/ai', authMiddleware, aiRoutes);
app.use('/api/suivis', authMiddleware, suivisRoutes);
app.use('/api/contacts', authMiddleware, contactsRoutes);
app.use('/api/alertes', authMiddleware, alertesRoutes);


// Endpoint de synchro manuel (protégé par SYNC_TOKEN)
app.post('/api/sync', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token !== process.env.SYNC_TOKEN) {
    return res.status(403).json({ error: 'Non autorisé' });
  }

  try {
    const dateSince = req.query.dateSince || null;
    const result = await syncBodaccData(dateSince);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error("Erreur de synchro:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  setupCron();
});

