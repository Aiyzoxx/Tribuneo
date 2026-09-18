import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testBAN() {
  const tempCsvPath = path.join(__dirname, 'test_ban.csv');
  let csvContent = 'id,adresse,postcode,city\n';
  csvContent += '"123","151 Rue Pierre Duchemin","60310","Thiescourt"\n';
  csvContent += '"456","59 Rue Aristide Briand","60320","Saint-Sauveur"\n';

  fs.writeFileSync(tempCsvPath, csvContent);

  const form = new FormData();
  form.append('data', fs.createReadStream(tempCsvPath));
  form.append('columns', 'adresse');
  form.append('columns', 'postcode');
  form.append('columns', 'city');
  form.append('postcode', 'postcode');
  form.append('citycode', 'city');

  try {
    const response = await axios.post('https://api-adresse.data.gouv.fr/search/csv/', form, {
      headers: { ...form.getHeaders() },
      responseType: 'stream'
    });

    const geocodedResults = {};
    
    await new Promise((resolve, reject) => {
      response.data
        .pipe(csv())
        .on('data', (data) => {
          console.log('Row received:', data);
          geocodedResults[data.id] = {
            latitude: data.latitude,
            longitude: data.longitude,
            result_type: data.result_type
          };
        })
        .on('end', resolve)
        .on('error', reject);
    });

    console.log('Final map:', geocodedResults);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testBAN();
