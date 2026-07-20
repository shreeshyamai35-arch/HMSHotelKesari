import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DailyReportForm from './pages/DailyReportForm';
import Reports from './pages/Reports';
import ReportDetail from './pages/ReportDetail';
import Issues from './pages/Issues';
import Reviews from './pages/Reviews';
import Revenue from './pages/Revenue';
import Bookings from './pages/Bookings';
import Performance from './pages/Performance';
import Insights from './pages/Insights';
import Notifications from './pages/Notifications';
import Users from './pages/Users';
import Profile from './pages/Profile';
import Occupancy from './pages/Occupancy';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route
            path="/report/new"
            element={
              <ProtectedRoute roles={['ADMIN', 'FRONT_OFFICE']}>
                <DailyReportForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/occupancy"
            element={
              <ProtectedRoute roles={['ADMIN', 'FRONT_OFFICE', 'REVENUE', 'MANAGEMENT']}>
                <Occupancy />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute roles={['ADMIN', 'MANAGEMENT', 'REVENUE']}>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/:id" element={<ReportDetail />} />
          <Route
            path="/issues"
            element={
              <ProtectedRoute roles={['ADMIN', 'FRONT_OFFICE', 'MANAGEMENT']}>
                <Issues />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reviews"
            element={
              <ProtectedRoute roles={['ADMIN', 'REVENUE', 'MANAGEMENT']}>
                <Reviews />
              </ProtectedRoute>
            }
          />
          <Route
            path="/revenue"
            element={
              <ProtectedRoute roles={['ADMIN', 'REVENUE', 'MANAGEMENT']}>
                <Revenue />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings"
            element={
              <ProtectedRoute roles={['ADMIN', 'REVENUE', 'MANAGEMENT']}>
                <Bookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/performance"
            element={
              <ProtectedRoute roles={['ADMIN', 'MANAGEMENT', 'REVENUE']}>
                <Performance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/insights"
            element={
              <ProtectedRoute roles={['ADMIN', 'MANAGEMENT', 'REVENUE']}>
                <Insights />
              </ProtectedRoute>
            }
          />
          <Route path="/notifications" element={<Notifications />} />
          <Route
            path="/users"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
