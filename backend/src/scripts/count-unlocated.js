import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const records = await prisma.$queryRaw`SELECT numen, siren, raison_sociale, adresse, type_procedure FROM procedures WHERE coordonnees IS NULL LIMIT 5`;
  console.log('Sample of unlocated records:', records);
  await prisma.$disconnect();
  process.exit(0);
}
run();
