import axios from 'axios';

const BASE_URL = 'https://bodacc-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/annonces-commerciales/records';

export const fetchBodaccAnnonces = async (limit = 100, offset = 0, dateSince = null) => {
  try {
    let whereClause = `(familleavis_lib:"Procédures collectives" OR familleavis_lib:"Ventes et cessions")`;
    if (dateSince) {
      whereClause += ` AND dateparution >= "${dateSince}"`;
    }

    const response = await axios.get(BASE_URL, {
      params: {
        where: whereClause,
        order_by: 'dateparution desc',
        limit,
        offset
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching BODACC data:', error.response?.data || error.message);
    throw error;
  }
};
