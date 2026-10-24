import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import MobileTabBar from './components/MobileTabBar';
import AiAssistantButton from './components/AiAssistantButton';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Discover from './pages/Discover';
import Profile from './pages/Profile';
import Calendar from './pages/Calendar';
import Marketplace from './pages/MarketPlace';
import UserProfileView from './pages/UserProfileView';
import Subscription from './pages/Subscription';
import { useAuth } from './context/AuthContext';
import AdminDashboard from './pages/AdminDashboard';
import Chat from './pages/Chat';
import Tournaments from './pages/Tournament';
import BrandLogin from './pages/BrandLogin';
import BrandDashboard from './pages/BrandDashboard';
import MyDeals from './pages/MyDeals';
import AiAssistant from './pages/AiAssistant';
import Feed from './pages/Feed';
import NewPost from './pages/NewPost';
import SavedPosts from './pages/SavedPosts';
import PostPage from './pages/PostPage';
import AthleteDna from './pages/AthleteDna';
import MyAthletes from './pages/MyAthletes';

function App() {
  const { user } = useAuth();
  return (
    <>
      <Navbar />
      {/* On mobile, leave room at the bottom for the fixed tab bar */}
      <main className={user ? 'pb-16 md:pb-0' : ''}>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Feed />
            </ProtectedRoute>
          }
        />
        <Route
          path="/new-post"
          element={
            <ProtectedRoute>
              <NewPost />
            </ProtectedRoute>
          }
        />
        <Route
          path="/saved"
          element={
            <ProtectedRoute>
              <SavedPosts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/post/:postId"
          element={
            <ProtectedRoute>
              <PostPage />
            </ProtectedRoute>
          }
        />
        {/* Athlete DNA: own dashboard, a coach's view of an athlete, and a coach's athlete list */}
        <Route path="/dna" element={<ProtectedRoute><AthleteDna /></ProtectedRoute>} />
        <Route path="/dna/:athleteId" element={<ProtectedRoute><AthleteDna /></ProtectedRoute>} />
        <Route path="/my-athletes" element={<ProtectedRoute><MyAthletes /></ProtectedRoute>} />
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
          path="/calendar"
          element={
            <ProtectedRoute>
              <Calendar />
            </ProtectedRoute>
          }
        />
        {/* Old address of the Calendar page */}
        <Route path="/bookings" element={<Navigate to="/calendar" replace />} />
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

        {/* Old Analytics page now lives in the Profile page's Stats tab */}
        <Route path="/analytics" element={<Navigate to="/profile?tab=stats" replace />} />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        {user?.role === 'admin' && (
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        )}

        <Route
          path="/chat/:bookingId"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tournaments"
          element={
            <ProtectedRoute>
              <Tournaments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/brand/login"
          element={
            <BrandLogin />
          }
        />
        <Route
          path="/brand/dashboard"
          element={
            <BrandDashboard />
          }
        />
        <Route
          path="/deals" element={
            <ProtectedRoute>
              <MyDeals />
            </ProtectedRoute>
          }
        />


        <Route
          path="/ai-assistant"
          element={
            <ProtectedRoute>
              <AiAssistant/>
            </ProtectedRoute>
          }
        />

      </Routes>
      </main>

      {/* Logged-in extras: bottom tabs (mobile) and the floating AI coach (every page) */}
      {user && (
        <>
          <MobileTabBar />
          <AiAssistantButton />
        </>
      )}
    </>
  );
}

export default App;