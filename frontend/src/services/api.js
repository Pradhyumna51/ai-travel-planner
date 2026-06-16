import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const validateBudget = async (destination, durationDays, travelers, budget) => {
  const response = await apiClient.post('/trips/validate-budget', {
    destination,
    duration_days: durationDays,
    travelers,
    budget
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

export const getHealth = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};
