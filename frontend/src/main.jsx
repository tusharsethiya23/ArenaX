import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css';
import { BrandAuthProvider } from './context/BrandAuthContext.jsx';

// Pages are loaded on demand. After a new deploy, an open tab may ask for a
// page file that no longer exists; reload once to pick up the new version.
// The timestamp stops it reloading over and over if the file really is gone;
// then PageErrorBoundary shows a "Couldn't load this page" message instead.
window.addEventListener('vite:preloadError', () => {
  try {
    const last = Number(sessionStorage.getItem('arenax:reloadedAt')) || 0;
    if (Date.now() - last < 10000) return;
    sessionStorage.setItem('arenax:reloadedAt', String(Date.now()));
  } catch { /* storage unavailable: still reload once */ }
  window.location.reload();
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <BrandAuthProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrandAuthProvider>
  </BrowserRouter>
);
