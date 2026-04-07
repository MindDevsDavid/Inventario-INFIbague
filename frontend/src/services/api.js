import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:8080/api' });

// Items
export const getItems = (category) =>
  api.get('/items', { params: category ? { category } : {} }).then((r) => r.data);

export const createItem = (data) => api.post('/items', data).then((r) => r.data);

export const updateItem = (id, data) => api.put(`/items/${id}`, data).then((r) => r.data);

export const deleteItem = (id) => api.delete(`/items/${id}`);

export const getDashboard = () => api.get('/dashboard').then((r) => r.data);

// Encargados
export const getEncargados = (all = false) =>
  api.get('/encargados', { params: all ? { all: 1 } : {} }).then((r) => r.data);

export const createEncargado = (data) => api.post('/encargados', data).then((r) => r.data);

export const updateEncargado = (id, data) =>
  api.put(`/encargados/${id}`, data).then((r) => r.data);

export const toggleEncargado = (id) =>
  api.patch(`/encargados/${id}/toggle`).then((r) => r.data);
