import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import MobileTabBar from './components/MobileTabBar';
import AiAssistantButton from './components/AiAssistantButton';
import ProtectedRoute from './components/ProtectedRoute';
import PageErrorBoundary from './components/PageErrorBoundary';
import { useAuth } from './context/AuthContext';

// Pages load on demand, so the first visit only downloads the page being opened
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Discover = lazy(() => import('./pages/Discover'));
const Profile = lazy(() => import('./pages/Profile'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Marketplace = lazy(() => import('./pages/MarketPlace'));
const UserProfileView = lazy(() => import('./pages/UserProfileView'));
const Subscription = lazy(() => import('./pages/Subscription'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Chat = lazy(() => import('./pages/Chat'));
const Tournaments = lazy(() => import('./pages/Tournament'));
const BrandLogin = lazy(() => import('./pages/BrandLogin'));
const BrandDashboard = lazy(() => import('./pages/BrandDashboard'));
const MyDeals = lazy(() => import('./pages/MyDeals'));
const AiAssistant = lazy(() => import('./pages/AiAssistant'));
const Feed = lazy(() => import('./pages/Feed'));
const NewPost = lazy(() => import('./pages/NewPost'));
const SavedPosts = lazy(() => import('./pages/SavedPosts'));
const PostPage = lazy(() => import('./pages/PostPage'));
const AthleteDna = lazy(() => import('./pages/AthleteDna'));
const MyAthletes = lazy(() => import('./pages/MyAthletes'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));

function App() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  return (
    <>
      <Navbar />
      {/* On mobile, leave room at the bottom for the fixed tab bar */}
      <main className={user ? 'pb-16 md:pb-0' : ''}>
      <PageErrorBoundary resetKey={pathname}>
      <Suspense fallback={<p className="empty-state" role="status">Loading...</p>}>
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
        {/* Public, readable logged out (Google sign-in setup links to these) */}
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
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
        <Route path="/brand/register" element={<BrandLogin />} />
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
      </Suspense>
      </PageErrorBoundary>
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