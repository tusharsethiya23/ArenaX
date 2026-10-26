import { createContext, useState, useContext, useCallback } from 'react';
import { clearSharedResources } from '../hooks/useSharedResource';
import { clearInvite } from '../utils/invite';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = (userData) => {
    clearInvite(); // an invite code only matters until the account exists
    localStorage.setItem('token', userData.token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  // Merge fresh fields (e.g. a new name or photo) into the saved user
  const updateUser = useCallback((fields) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...fields };
      localStorage.setItem('user', JSON.stringify(next));
      return next;
    });
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    clearSharedResources(); // the next person to log in starts with no cached data
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);