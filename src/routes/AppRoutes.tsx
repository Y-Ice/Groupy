import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminLayout } from '../components/layouts/AdminLayout';

import { Login } from '../pages/admin/Login';
import { ForgotPassword } from '../pages/admin/ForgotPassword';
import { DashboardHome } from '../pages/admin/DashboardHome';
import { Announcements } from '../pages/admin/Announcements';
import { Tables } from '../pages/admin/Tables';
import { Stacks } from '../pages/admin/Stacks';
import { Students } from '../pages/admin/Students';
import { Groups } from '../pages/admin/Groups';
import { QRCodes } from '../pages/admin/QRCodes';
import { Settings } from '../pages/admin/Settings';

import { StudentRegistration } from '../pages/student/StudentRegistration';
import { SubmissionSuccess } from '../pages/student/SubmissionSuccess';
import { NotFound } from '../pages/NotFound';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Admin Auth Routes */}
      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin/forgot-password" element={<ForgotPassword />} />

      {/* Protected Admin Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardHome />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="tables" element={<Tables />} />
          <Route path="stacks" element={<Stacks />} />
          <Route path="students" element={<Students />} />
          <Route path="groups" element={<Groups />} />
          <Route path="qr-codes" element={<QRCodes />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>

      {/* Student Public QR Routes (No Auth Required) */}
      <Route path="/table/:tableId" element={<StudentRegistration />} />
      <Route path="/table/:tableId/success" element={<SubmissionSuccess />} />

      {/* Fallback Redirects */}
      <Route path="/" element={<Navigate to="/admin/login" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
