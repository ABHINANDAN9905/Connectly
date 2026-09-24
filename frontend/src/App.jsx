import { Navigate, Route, Routes } from "react-router-dom";

import HomePage from "./pages/HomePage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import FriendsPage from "./pages/FriendsPage.jsx";
import CallPage from "./pages/CallPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import ProfileSetupPage from "./pages/ProfileSetupPage.jsx";
import VerifyEmailPage from "./pages/VerifyEmailPage.jsx";
import StudentProfilePage from "./pages/StudentProfilePage.jsx";

import { Toaster } from "react-hot-toast";

import PageLoader from "./components/PageLoader.jsx";
import Layout from "./components/Layout.jsx";

import { useThemeStore } from "./store/useThemeStore.js";
import { NotificationProvider } from "./contexts/NotificationContext.jsx";
import useAuthUser from "./hooks/useAuthUser.js";

// ==========================================
// PROTECTED ROUTE
// ==========================================

const ProtectedRoute = ({ children }) => {
  const { authUser, isLoading } = useAuthUser();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!authUser) {
    return <Navigate to="/login" replace />;
  }

  if (!authUser.isOnboarded) {
    return <Navigate to="/profile-setup" replace />;
  }

  return children;
};

// ==========================================
// PUBLIC ROUTE
// ==========================================

const PublicRoute = ({ children }) => {
  const { authUser, isLoading } = useAuthUser();

  if (isLoading) {
    return <PageLoader />;
  }

  if (authUser) {
    return (
      <Navigate
        to={authUser.isOnboarded ? "/" : "/profile-setup"}
        replace
      />
    );
  }

  return children;
};

// ==========================================
// ONBOARDING ROUTE
// ==========================================

const OnboardingRoute = ({ children }) => {
  const { authUser, isLoading } = useAuthUser();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!authUser) {
    return <Navigate to="/login" replace />;
  }

  if (authUser.isOnboarded) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// ==========================================
// APP
// ==========================================

const App = () => {
  const { theme } = useThemeStore();

  return (
    <NotificationProvider>
      <div
        className="flex flex-col min-h-screen"
        data-theme={theme}
      >
        <Routes>

          {/* ==========================================
              AUTH ROUTES
          ========================================== */}

          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          <Route
            path="/signup"
            element={
              <PublicRoute>
                <SignUpPage />
              </PublicRoute>
            }
          />

          <Route
            path="/verify-email/:token"
            element={<VerifyEmailPage />}
          />

          {/* ==========================================
              ONBOARDING
          ========================================== */}

          <Route
            path="/profile-setup"
            element={
              <OnboardingRoute>
                <ProfileSetupPage />
              </OnboardingRoute>
            }
          />

          {/* ==========================================
              HOME
          ========================================== */}

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout showSidebar={true}>
                  <HomePage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* ==========================================
              NOTIFICATIONS
          ========================================== */}

          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Layout showSidebar={true}>
                  <NotificationsPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* ==========================================
              FRIENDS
          ========================================== */}

          <Route
            path="/friends"
            element={
              <ProtectedRoute>
                <Layout showSidebar={true}>
                  <FriendsPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* ==========================================
              MY PROFILE
          ========================================== */}

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout showSidebar={true}>
                  <ProfilePage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* ==========================================
              STUDENT PROFILE
          ========================================== */}

          <Route
            path="/student/:id"
            element={
              <ProtectedRoute>
                <Layout showSidebar={true}>
                  <StudentProfilePage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* ==========================================
              CALL
          ========================================== */}

          <Route
            path="/call/:id"
            element={
              <ProtectedRoute>
                <CallPage />
              </ProtectedRoute>
            }
          />

          {/* ==========================================
              CHAT
          ========================================== */}

          <Route
            path="/chat/:id"
            element={
              <ProtectedRoute>
                <Layout showSidebar={false}>
                  <ChatPage />
                </Layout>
              </ProtectedRoute>
            }
          />

        </Routes>

        <Toaster />
      </div>
    </NotificationProvider>
  );
};

export default App;