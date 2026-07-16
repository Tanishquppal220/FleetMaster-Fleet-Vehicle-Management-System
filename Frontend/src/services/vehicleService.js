import api from './api';

const vehicleService = {
  
  getVehicles: async (filters = {}) => {
    const response = await api.get('/vehicles', { params: filters });
    return response.data.data;
  },

  createVehicle: async (vehicleData) => {
    const response = await api.post('/vehicles', vehicleData);
    return response.data.data;
  },

  updateVehicle: async (id, vehicleData) => {
    const response = await api.put(`/vehicles/${id}`, vehicleData);
    return response.data.data;
  },

  deleteVehicle: async (id) => {
    const response = await api.delete(`/vehicles/${id}`);
    return response.data;
  },
};

export default vehicleService;