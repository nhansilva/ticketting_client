import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import HomePage from '../pages/home/HomePage';
import ProfilePage from '../pages/profile/ProfilePage';
import CallbackPage from '../pages/auth/CallbackPage';
import EventDetailPage from '../pages/events/EventDetailPage';
import SeatMapPage from '../pages/seats/SeatMapPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Navigate to="/home" replace /> : <>{children}</>;
}

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <PublicRoute><LoginPage /></PublicRoute> },
  { path: '/register', element: <PublicRoute><RegisterPage /></PublicRoute> },
  { path: '/forgot-password', element: <PublicRoute><ForgotPasswordPage /></PublicRoute> },
  { path: '/reset-password', element: <PublicRoute><ResetPasswordPage /></PublicRoute> },
  { path: '/home', element: <PrivateRoute><HomePage /></PrivateRoute> },
  { path: '/profile', element: <PrivateRoute><ProfilePage /></PrivateRoute> },
  { path: '/events/:id', element: <PrivateRoute><EventDetailPage /></PrivateRoute> },
  { path: '/events/:id/seats', element: <PrivateRoute><SeatMapPage /></PrivateRoute> },
  { path: '/auth/callback', element: <CallbackPage /> },
]);
