// Script pour créer un utilisateur
// Usage: node src/scripts/create-user.js <email> <password> [nom]
// Exemple: node src/scripts/create-user.js admin@tribuneo.xyz MonMotDePasse123 Admin

import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const [,, email, password, nom] = process.argv;

if (!email || !password) {
  console.error('Usage: node src/scripts/create-user.js <email> <password> [nom]');
  process.exit(1);
}

async function main() {
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      nom: nom || null,
      role: 'admin',
    }
  });

  console.log(`✅ Utilisateur créé avec succès :`);
  console.log(`   Email : ${user.email}`);
  console.log(`   Nom   : ${user.nom || '—'}`);
  console.log(`   Rôle  : ${user.role}`);
}

main()
  .catch(err => {
    console.error('❌ Erreur :', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
