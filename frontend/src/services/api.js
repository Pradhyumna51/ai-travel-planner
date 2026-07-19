import axios from 'axios';

const getApiUrl = () => {
  let url = import.meta.env.VITE_API_URL;
  if (url) {
    // If VITE_API_URL doesn't end with /api or /api/, automatically append it
    if (!url.endsWith('/api') && !url.endsWith('/api/')) {
      url = url.replace(/\/$/, '') + '/api';
    }
    return url;
  }
  // Automatically fallback to hosting device's IP (e.g. for phone access on network)
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const isLocalIp = host.startsWith('192.168.') || host.startsWith('10.') || host.startsWith('172.') || host.endsWith('.local');
    if (isLocalIp) {
      return `http://${host}:5000/api`;
    }
  }
  return 'http://localhost:5000/api';
};

const API_URL = getApiUrl();

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const validateBudget = async (destination, durationDays, travelers, budget, startDate, endDate, travelStyle) => {
  const response = await apiClient.post('/trips/validate-budget', {
    destination,
    duration_days: durationDays,
    travelers,
    budget,
    start_date: startDate,
    end_date: endDate,
    travel_style: travelStyle
  });
  return response.data;
};

export const generateItinerary = async (tripData) => {
  const response = await apiClient.post('/trips/generate', tripData);
  return response.data;
};

export const saveTrip = async (tripAndItinerary) => {
  const response = await apiClient.post('/trips/save', tripAndItinerary);
  return response.data;
};

export const getSavedTrips = async () => {
  const response = await apiClient.get('/trips');
  return response.data;
};

export const getTripDetails = async (id) => {
  const response = await apiClient.get(`/trips/${id}`);
  return response.data;
};

export const getMapData = async (id) => {
  const response = await apiClient.get(`/trips/${id}/map-data`);
  return response.data;
};

export const getHealth = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

export const getDirections = async (routeId) => {
  const response = await apiClient.get(`/trips/routes/${routeId}/directions`);
  return response.data;
};
