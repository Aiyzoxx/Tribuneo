import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function run() {
  const res = await prisma.$queryRaw`SELECT id FROM procedures LIMIT 1`;
  console.log('ID:', res);
  console.log('Recent:', res);
  process.exit(0);
}
run();
