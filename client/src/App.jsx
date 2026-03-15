import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import AppLayout from '@/components/layout/AppLayout';
import LoginPage from '@/pages/Login/LoginPage';
import ForSalePage from '@/pages/ForSale/ForSalePage';
import SoldPage from '@/pages/Sold/SoldPage';
import WishlistPage from '@/pages/Wishlist/WishlistPage';
import SellersPage from '@/pages/Sellers/SellersPage';
import PurchasedPage from '@/pages/Purchased/PurchasedPage';
import StatisticsPage from '@/pages/Statistics/StatisticsPage';
import ReportsPage from '@/pages/Reports/ReportsPage';
import RemindersPage from '@/pages/Reminders/RemindersPage';
import PlannerPage from '@/pages/Planner/PlannerPage';
import SettingsPage from '@/pages/Settings/SettingsPage';
import VitrinPage from '@/pages/Public/VitrinPage';

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/products" replace />;
  return children;
}


function LoginRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/for-sale" replace />;
  return <LoginPage />;
}

export default function App() {
  const initTheme = useThemeStore((s) => s.initTheme);
  const initLanguage = useLanguageStore((s) => s.initLanguage);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    initTheme();
    initLanguage();
  }, [initTheme, initLanguage]);


  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/products" element={<VitrinPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/for-sale" replace />} />
          <Route path="for-sale" element={<ForSalePage />} />
          <Route path="sold" element={<SoldPage />} />
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="sellers" element={<SellersPage />} />
          <Route path="purchased" element={<PurchasedPage />} />
          <Route path="statistics" element={<StatisticsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="reminders" element={<RemindersPage />} />
          <Route path="planner" element={<PlannerPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/products" replace />} />
      </Routes>
    </>
  );
}
