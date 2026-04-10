import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Adjunta el JWT en cada request
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si el servidor devuelve 401, limpia la sesión y redirige al login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      sessionStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = (username, password) =>
  api.post('/auth/login', { username, password }).then((r) => r.data);

// Users (solo admin)
export const getUsers = () => api.get('/users').then((r) => r.data);
export const createUser = (data) => api.post('/users', data).then((r) => r.data);
export const updateUser = (id, data) => api.put(`/users/${id}`, data).then((r) => r.data);
export const toggleUser = (id) => api.patch(`/users/${id}/toggle`).then((r) => r.data);

// Items
export const getItems = (category, encargadoId) => {
  const params = {};
  if (category) params.category = category;
  if (encargadoId) params.encargado_id = encargadoId;
  return api.get('/items', { params }).then((r) => r.data);
};

export const createItem = (data) => api.post('/items', data).then((r) => r.data);

export const updateItem = (id, data) => api.put(`/items/${id}`, data).then((r) => r.data);

export const deleteItem = (id) => api.delete(`/items/${id}`);

export const getDashboard = () => api.get('/dashboard').then((r) => r.data);

// Perfil propio
export const getMe = () => api.get('/me').then((r) => r.data);
export const getMyAssets = () => api.get('/me/assets').then((r) => r.data);

// Tickets
export const getTickets = () => api.get('/tickets').then((r) => r.data);
export const createTicket = (data) => api.post('/tickets', data).then((r) => r.data);
export const updateTicket = (id, data) => api.put(`/tickets/${id}`, data).then((r) => r.data);

// Encargados
export const getEncargados = (all = false) =>
  api.get('/encargados', { params: all ? { all: 1 } : {} }).then((r) => r.data);

export const createEncargado = (data) => api.post('/encargados', data).then((r) => r.data);

export const updateEncargado = (id, data) =>
  api.put(`/encargados/${id}`, data).then((r) => r.data);

export const toggleEncargado = (id) =>
  api.patch(`/encargados/${id}/toggle`).then((r) => r.data);
