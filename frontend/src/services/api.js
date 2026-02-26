import axios from 'axios';

// Connect to local Express server by default
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
});

export const fetchVehicles = async () => {
    const response = await api.get('/vehicles');
    return response.data;
};

export const fetchLatestTelemetry = async (vehicleId) => {
    const response = await api.get(`/vehicles/${vehicleId}/latest`);
    return response.data;
};

export const fetchRecentTelemetry = async (vehicleId, limit = 50) => {
    const response = await api.get(`/vehicles/${vehicleId}/recent?limit=${limit}`);
    return response.data;
};

export const fetchVehicleSummary = async (vehicleId) => {
    const response = await api.get(`/vehicles/${vehicleId}/summary`);
    return response.data;
};

export const fetchTelemetryRange = async (vehicleId, start, end) => {
    const url = `/vehicles/${vehicleId}?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
    const response = await api.get(url);
    return response.data;
};

export default api;
