import axios from 'axios';
import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

let redisClient;
if (process.env.REDIS_URL) {
  redisClient = createClient({ url: process.env.REDIS_URL });
  redisClient.on('error', (err) => console.error('Redis Client Error', err));
  redisClient.connect().catch(console.error);
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const geocodeAddress = async (address) => {
  if (!address) return null;

  const cacheKey = `geocode:${Buffer.from(address).toString('base64')}`;
  
  if (redisClient) {
    try {
      const cachedCoords = await redisClient.get(cacheKey);
      if (cachedCoords) {
        return JSON.parse(cachedCoords);
      }
    } catch (err) {
      console.error('Redis get error:', err);
    }
  }

  try {
    await delay(250);
    const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(address)}&limit=1`;
    const response = await axios.get(url);
    
    if (response.data && response.data.features && response.data.features.length > 0) {
      const coords = response.data.features[0].geometry.coordinates; // [longitude, latitude]
      
      if (redisClient) {
        await redisClient.set(cacheKey, JSON.stringify(coords), { EX: 30 * 24 * 60 * 60 });
      }
      
      return coords;
    }
    return null;
  } catch (error) {
    console.error(`Geocoding error for address "${address}":`, error.message);
    return null;
  }
};
