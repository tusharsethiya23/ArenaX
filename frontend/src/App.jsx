import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Discover from './pages/Discover';
import Profile from './pages/Profile';
import Bookings from './pages/Bookings';
import Marketplace from './pages/MarketPlace';
import UserProfileView from './pages/UserProfileView';
import Analytics from './pages/Analytics';
import Subscription from './pages/Subscription';
import { useAuth } from './context/AuthContext';

function App() {
   const { user } = useAuth();
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/discover" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/discover"
          element={
            <ProtectedRoute>
              <Discover />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <Bookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/marketplace"
          element={
            <ProtectedRoute>
              <Marketplace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile-view/:userId"
          element={
            <ProtectedRoute>
              <UserProfileView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subscription"
          element={<ProtectedRoute>
            <Subscription />
          </ProtectedRoute>
          }
        />

        {user?.role === 'coach' && (
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>

            }
          />
        )}
      </Routes>
    </>
  );
}

export default App;