import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoadingState } from './components/ui';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Lazy load heavy pages
const DailyReportForm = lazy(() => import('./pages/DailyReportForm'));
const Reports = lazy(() => import('./pages/Reports'));
const ReportDetail = lazy(() => import('./pages/ReportDetail'));
const Issues = lazy(() => import('./pages/Issues'));
const Reviews = lazy(() => import('./pages/Reviews'));
const Revenue = lazy(() => import('./pages/Revenue'));
const Bookings = lazy(() => import('./pages/Bookings'));
const Performance = lazy(() => import('./pages/Performance'));
const Insights = lazy(() => import('./pages/Insights'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Users = lazy(() => import('./pages/Users'));
const Profile = lazy(() => import('./pages/Profile'));
const OccupancyNew = lazy(() => import('./pages/OccupancyNew'));
const Commissions = lazy(() => import('./pages/Commissions'));
const Settings = lazy(() => import('./pages/Settings'));
const Analytics = lazy(() => import('./pages/Analytics'));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingState />}>
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
                  <OccupancyNew />
                </ProtectedRoute>
              }
            />
            <Route
              path="/commissions"
              element={
                <ProtectedRoute roles={['ADMIN', 'REVENUE']}>
                  <Commissions />
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
      </Suspense>
    </BrowserRouter>
  );
}
