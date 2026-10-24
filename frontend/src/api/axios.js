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

// A 401 on a logged-in request means the saved session is no longer valid
// (expired, or the account was deleted): clear it and go to the login page.
// /auth/ requests are skipped so login errors show on the form as usual.
API.interceptors.response.use(undefined, (error) => {
  const sentToken = error.config?.headers?.Authorization;
  if (error.response?.status === 401 && sentToken && !error.config.url?.startsWith('/auth/')) {
    const wasBrand = !localStorage.getItem('token') && localStorage.getItem('brandToken');
    ['token', 'user', 'brandToken', 'brand'].forEach((k) => localStorage.removeItem(k));
    const loginPage = wasBrand ? '/brand/login' : '/login';
    if (window.location.pathname !== loginPage) window.location.assign(loginPage);
  }
  return Promise.reject(error);
});

export default API;