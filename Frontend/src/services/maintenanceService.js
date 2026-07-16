import api from './api';

const maintenanceService = {
  
  getMaintenanceRecords: async (filters = {}) => {
    const response = await api.get('/maintenance', { params: filters });
    return response.data.data;
  },

  getMaintenanceRecordById: async (id) => {
    const response = await api.get(`/maintenance/${id}`);
    return response.data.data;
  },

  createMaintenanceRecord: async (maintenanceData) => {
    const response = await api.post('/maintenance', maintenanceData);
    return response.data.data;
  },

  updateMaintenanceRecord: async (id, maintenanceData) => {
    const response = await api.put(`/maintenance/${id}`, maintenanceData);
    return response.data.data;
  },

  deleteMaintenanceRecord: async (id) => {
    const response = await api.delete(`/maintenance/${id}`);
    return response.data;
  },
};

export default maintenanceService;