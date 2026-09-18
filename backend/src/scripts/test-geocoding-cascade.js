import { PrismaClient } from '@prisma/client';
import { geocodeCascade } from '../services/geocoding.js';

const prisma = new PrismaClient();

async function run() {
  console.log('Fetching 5 difficult unlocated companies...');
  const testCases = [
    { id: 1, siren: '324428178', adresse: 'ZA LE PETIT BOIS', code_postal: '33000', ville: 'BORDEAUX' }, // Will use Sirene
    { id: 2, siren: '883907794', adresse: 'BÂT C 12 RUE DES FLEURS', code_postal: '75001', ville: 'PARIS' }, // Will use Sirene or Cleaned
    { id: 3, siren: null, adresse: 'BÂT 3 ZI NORD', code_postal: '29200', ville: 'BREST' }, // Will use Cleaned BAN or Commune
    { id: 4, siren: null, adresse: 'LIEU DIT INTROUVABLE', code_postal: '59000', ville: 'LILLE' } // Will fallback to Commune
  ];

  for (const proc of testCases) {
    console.log(`\n--- ID: ${proc.id} | SIREN: ${proc.siren}`);
    console.log(`Adresse brute: ${proc.adresse} ${proc.code_postal} ${proc.ville}`);
    
    const result = await geocodeCascade(proc.siren, proc.adresse, proc.code_postal, proc.ville);
    
    if (result) {
      console.log(`✅ Success! Precision: ${result.precision} | Coords: [${result.coords.join(', ')}]`);
    } else {
      console.log(`❌ Failed to geocode.`);
    }
  }

  await prisma.$disconnect();
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
