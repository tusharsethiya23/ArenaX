// axios.js
// Central API instance. Attaches whichever token exists: a regular user
// token or a brand token. Both go to the same backend.

import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token') || localStorage.getItem('brandToken');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;