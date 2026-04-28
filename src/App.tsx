import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';

import AdminDashboard from './pages/admin/AdminDashboard';
import Storefront from './pages/user/Storefront';

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/admin/*" element={<AdminDashboard />} />
        <Route path="/*" element={<Storefront />} />
      </Routes>
    </>
  );
}
