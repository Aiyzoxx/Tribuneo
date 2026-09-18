import { useState } from 'react';
import axios from 'axios';

const useSearch = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useState(null); // { lat, lon, radius, cityName }

  const performSearch = async (lat, lon, radius, type, months, companyName, cityName) => {
    setLoading(true);
    setError(null);
    setSearchParams({ lat, lon, radius, cityName, companyName });
    try {
      const url = import.meta.env.VITE_API_URL || '/api';
      const params = { radius, type, months, companyName };
      if (lat !== null && lat !== undefined) params.lat = lat;
      if (lon !== null && lon !== undefined) params.lon = lon;
      const response = await axios.get(`${url}/search`, { params });
      setResults(response.data);
    } catch (err) {
      console.error(err);
      setError('Erreur lors de la récupération des données. Veuillez réessayer.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return { results, loading, error, performSearch, searchParams };
};

export default useSearch;
