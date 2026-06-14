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


import { Toaster } from "react-hot-toast";

import PageLoader from "./components/PageLoader.jsx";
import Footer from "./components/Footer.jsx";

import Layout from "./components/Layout.jsx";
import { useThemeStore } from "./store/useThemeStore.js";
import { NotificationProvider } from "./contexts/NotificationContext.jsx";
import useAuthUser from "./hooks/useAuthUser.js";

const ProtectedRoute = ({ children }) => {
  const { authUser, isLoading } = useAuthUser();

  if (isLoading) return <PageLoader />;
  if (!authUser) return <Navigate to="/login" replace />;
  if (!authUser.isOnboarded) return <Navigate to="/profile-setup" replace />;

  return children;
};

const PublicRoute = ({ children }) => {
  const { authUser, isLoading } = useAuthUser();

  if (isLoading) return <PageLoader />;
  if (authUser) return <Navigate to={authUser.isOnboarded ? "/" : "/profile-setup"} replace />;

  return children;
};

const OnboardingRoute = ({ children }) => {
  const { authUser, isLoading } = useAuthUser();

  if (isLoading) return <PageLoader />;
  if (!authUser) return <Navigate to="/login" replace />;
  if (authUser.isOnboarded) return <Navigate to="/" replace />;

  return children;
};

const App = () => {
  const { theme } = useThemeStore();

  return (

    <NotificationProvider>
      <div className="flex flex-col min-h-screen" data-theme={theme}>
        <Routes>
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
            path="/profile-setup"
            element={
              <OnboardingRoute>
                <ProfileSetupPage />
              </OnboardingRoute>
            }
          />

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

          <Route
            path="/call/:id"
            element={
              <ProtectedRoute>
                <CallPage />
              </ProtectedRoute>
            }
          />

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

          <Route
            path="/verify-email/:token"
            element={<VerifyEmailPage />}
          />
        </Routes>

      <Toaster />
    </div>
    </NotificationProvider>
  );
};
export default App;
