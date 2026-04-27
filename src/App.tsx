import React from 'react';
import { Routes, Route } from 'react-router-dom';

import AdminDashboard from './pages/admin/AdminDashboard';
import Storefront from './pages/user/Storefront';

export default function App() {
  return (
    <Routes>
      <Route path="/admin/*" element={<AdminDashboard />} />
      <Route path="/*" element={<Storefront />} />
    </Routes>
  );
}
