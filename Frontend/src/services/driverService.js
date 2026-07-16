import api from './api';

const driverService = {
    
  getDrivers: async () => {
    const response = await api.get('/drivers');
    return response.data.data;
  },

  updateDriverStatus: async (id, statusData) => {
    const response = await api.put(`/drivers/${id}`, statusData);
    return response.data.data;
  },

  getDriverTasks: async () => {
    const response = await api.get('/drivers/tasks');
    return response.data.data;
  },
};

export default driverService;