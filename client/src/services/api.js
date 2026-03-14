import axios from 'axios';
import { API_BASE } from '@/lib/constants';

const api = axios.create({ baseURL: API_BASE });

// Otomatik token ekle
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 → login'e yönlendir
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// Jersey servisleri
export const jerseyService = {
  getAll: (params) => api.get('/jerseys', { params }),
  getOne: (id) => api.get(`/jerseys/${id}`),
  create: (formData) => api.post('/jerseys', formData),
  update: (id, formData) => api.put(`/jerseys/${id}`, formData),
  delete: (id) => api.delete(`/jerseys/${id}`),
  duplicate: (id) => api.post(`/jerseys/${id}/duplicate`),
  markSold: (id, data) => api.post(`/jerseys/${id}/mark-sold`, data),
  deleteImage: (publicId) => api.post('/jerseys/images/delete', { publicId }),
  bulkDelete: (ids) => api.delete('/jerseys/bulk', { data: { ids } }),
  bulkUpdatePrice: (ids, sellPrice) => api.patch('/jerseys/bulk/price', { ids, sellPrice }),
  getFilterOptions: (params) => api.get('/jerseys/filter-options', { params }),
  toggleFeatured: (id) => api.patch(`/jerseys/${id}/featured`),
};

// Sale servisleri
export const saleService = {
  getAll: (params) => api.get('/sales', { params }),
  getFilterOptions: () => api.get('/sales/filter-options'),
  getOne: (id) => api.get(`/sales/${id}`),
  create: (data) => api.post('/sales', data),
  update: (id, data) => api.put(`/sales/${id}`, data),
  delete: (id) => api.delete(`/sales/${id}`),
};

// Purchase servisleri
export const purchaseService = {
  getAll: (params) => api.get('/purchases', { params }),
  getFilterOptions: () => api.get('/purchases/filter-options'),
  create: (data) => api.post('/purchases', data),
  update: (id, data) => api.put(`/purchases/${id}`, data),
  delete: (id) => api.delete(`/purchases/${id}`),
  promote: (id, data) => api.post(`/purchases/${id}/promote`, data),
  demote: (id) => api.delete(`/purchases/${id}/demote`),
};

// Seller servisleri
export const sellerService = {
  getAll: () => api.get('/sellers'),
  create: (data) => api.post('/sellers', data),
  update: (id, data) => api.put(`/sellers/${id}`, data),
  delete: (id) => api.delete(`/sellers/${id}`),
};

// Wishlist servisleri
export const wishlistService = {
  getAll: (params) => api.get('/wishlist', { params }),
  create: (data, imageFile) => {
    if (imageFile) {
      const fd = new FormData();
      fd.append('data', JSON.stringify(data));
      fd.append('image', imageFile);
      return api.post('/wishlist', fd);
    }
    return api.post('/wishlist', data);
  },
  update: (id, data, imageFile) => {
    if (imageFile) {
      const fd = new FormData();
      fd.append('data', JSON.stringify(data));
      fd.append('image', imageFile);
      return api.put(`/wishlist/${id}`, fd);
    }
    return api.put(`/wishlist/${id}`, data);
  },
  delete: (id) => api.delete(`/wishlist/${id}`),
  reorder: (items) => api.put('/wishlist/reorder', { items }),
};

// Upload servisleri
export const uploadService = {
  images: (files) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('images', f));
    return api.post('/uploads/images', fd);
  },
};

// Reminder servisleri
export const reminderService = {
  getAll: (params) => api.get('/reminders', { params }),
  create: (formData) => api.post('/reminders', formData),
  update: (id, data) => api.put(`/reminders/${id}`, data),
  delete: (id) => api.delete(`/reminders/${id}`),
};

// Planner servisleri
export const plannerService = {
  getMonth: (month) => api.get('/planner', { params: { month } }),
  getDay: (date) => api.get('/planner/day', { params: { date } }),
  create: (data) => api.post('/planner', data),
  update: (id, data) => api.put(`/planner/${id}`, data),
  delete: (id) => api.delete(`/planner/${id}`),
  toggle: (id) => api.patch(`/planner/${id}/toggle`),
};

// Stats servisleri
export const statsService = {
  counts: () => api.get('/stats/counts'),
  overview: () => api.get('/stats/overview'),
  monthlySales: (year) => api.get('/stats/monthly-sales', { params: { year } }),
  teams: () => api.get('/stats/teams'),
  sizes: () => api.get('/stats/sizes'),
  platforms: () => api.get('/stats/platforms'),
  buyers: () => api.get('/stats/buyers'),
};

// Report servisleri
export const reportService = {
  available: () => api.get('/reports/available'),
  monthly: (year, month) => api.get(`/reports/${year}/${month}`),
};

// Public servisler (auth gerekmez)
export const publicService = {
  getJerseys: (params) => api.get('/public/jerseys', { params }),
  getFilterOptions: () => api.get('/public/filter-options'),
  getJerseyById: (id) => api.get(`/public/jerseys/${id}`),
  getTeams: () => api.get('/public/teams'),
  getSettings: () => api.get('/public/settings'),
};

// Settings servisleri
export const settingsService = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
};
