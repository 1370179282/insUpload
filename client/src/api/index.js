import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 系统设置 API
export const getSettings = () => api.get('/settings');
export const updateSettings = (data) => api.put('/settings', data);
export const readBrandFolders = () => api.post('/settings/read-brands');
export const initializeMaterials = () => {
  console.log('调用 initializeMaterials API 函数');
  console.log('API 请求 URL:', `${API_URL}/settings/initialize-materials`);
  return api.post('/settings/initialize-materials')
    .then(response => {
      console.log('API 请求成功，响应:', response);
      return response;
    })
    .catch(error => {
      console.error('API 请求失败，错误:', error);
      throw error;
    });
};
export const createTestDirectories = (rootPath) => api.post('/settings/create-test-directories', { rootPath });
export const getFileTypes = () => api.get('/settings/file-types');
export const updateFileType = (id, data) => api.put(`/settings/file-types/${id}`, data);

// 品牌管理 API
export const getAllBrands = () => api.get('/brands');
export const updateBrandWeight = (id, weight) => api.put(`/brands/${id}`, { weight });

// 文件管理 API
export const getFiles = (params) => api.get('/files', { params });
export const updateFileStatus = (ids, status) => api.put('/files/status', { ids, status });
export const generateQueue = (fileType) => api.post('/files/generate-queue', { fileType });
export const completeUpload = (id) => api.post(`/files/${id}/complete`);

export default api; 