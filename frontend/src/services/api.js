import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:8080/api' });

export const getItems = (category) =>
  api.get('/items', { params: category ? { category } : {} }).then((r) => r.data);

export const createItem = (data) => api.post('/items', data).then((r) => r.data);

export const updateItem = (id, data) => api.put(`/items/${id}`, data).then((r) => r.data);

export const deleteItem = (id) => api.delete(`/items/${id}`);

export const getDashboard = () => api.get('/dashboard').then((r) => r.data);
