// BrandAuthContext.jsx
// Separate auth context for Brand accounts. Brands are a different entity
// from Users (different model, different login), so they get their own
// context instead of sharing AuthContext.

import { createContext, useState, useContext } from 'react';

const BrandAuthContext = createContext();

export const BrandAuthProvider = ({ children }) => {
  // Restore the logged-in brand from localStorage on page refresh
  const [brand, setBrand] = useState(() => {
    const saved = localStorage.getItem('brand');
    return saved ? JSON.parse(saved) : null;
  });

  const brandLogin = (brandData) => {
    localStorage.setItem('brandToken', brandData.token);
    localStorage.setItem('brand', JSON.stringify(brandData));
    setBrand(brandData);
  };

  const brandLogout = () => {
    localStorage.removeItem('brandToken');
    localStorage.removeItem('brand');
    setBrand(null);
  };

  return (
    <BrandAuthContext.Provider value={{ brand, brandLogin, brandLogout }}>
      {children}
    </BrandAuthContext.Provider>
  );
};

export const useBrandAuth = () => useContext(BrandAuthContext);