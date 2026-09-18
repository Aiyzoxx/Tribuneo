import cron from 'node-cron';
import { syncBodaccData } from '../services/sync.js';

export const setupCron = () => {
  cron.schedule('0 2 * * *', async () => {
    console.log('Running nightly BODACC sync...');
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];
      
      await syncBodaccData(dateStr);
    } catch (error) {
      console.error('Nightly sync failed:', error);
    }
  });
  console.log('Nightly cron job configured (02:00 AM).');
};
