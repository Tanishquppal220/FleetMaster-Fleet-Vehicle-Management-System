import api from './api';

const adminService = {
  getPendingUsers: async () => {
    const res = await api.get('/auth/pending-users');
    return res.data.data;
  },

  approveUser: async (id) => {
    const res = await api.put(`/auth/approve-user/${id}`);
    return res.data;
  },

  rejectUser: async (id) => {
    const res = await api.delete(`/auth/reject-user/${id}`);
    return res.data;
  },
};

export default adminService;
