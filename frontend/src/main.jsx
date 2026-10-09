import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css';
import { BrandAuthProvider } from './context/BrandAuthContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <BrandAuthProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrandAuthProvider>
  </BrowserRouter>
);