import api from './api';

const uploadService = {
  uploadImage: async (file) => {
    const data = new FormData();
    data.append('image', file);

    const response = await api.post('/upload', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },
};

export default uploadService;
