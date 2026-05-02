import { useEffect } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Layout from './components/Layout';
import { SkeletonBlock } from './components/ui/skeleton';
import { getMe } from './lib/api';
import { useAuthStore } from './store/authStore';
import Billing from './pages/Billing';
import BulkUpload from './pages/BulkUpload';
import ClientDetail from './pages/ClientDetail';
import Clients from './pages/Clients';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import Services from './pages/Services';
import PlaceholderPage from './pages/PlaceholderPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/clients/:clientId" element={<ClientDetail />} />
        <Route path="/bulk-upload" element={<BulkUpload />} />
        <Route path="/services" element={<Services />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/reports" element={<Reports />} />
        <Route
          path="/settings"
          element={<PlaceholderPage title="Settings" description="Workspace settings and preferences coming next." />}
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function ProtectedLayout() {
  const setUser = useAuthStore((state) => state.setUser);
  const clearUser = useAuthStore((state) => state.clearUser);

  const query = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getMe,
    retry: false,
    staleTime: 300000,
  });

  useEffect(() => {
    if (query.data) {
      const p = query.data;
      setUser(p.user ?? p.data?.user ?? p);
    }
    if (query.isError) clearUser();
  }, [query.data, query.isError, setUser, clearUser]);

  if (query.isLoading) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-zinc-950">
        <div className="hidden w-64 shrink-0 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:block">
          <div className="space-y-3 p-4">
            <SkeletonBlock className="h-12 w-full" />
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <SkeletonBlock key={i} className="h-9 w-full" />
            ))}
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col p-6 lg:p-8">
          <SkeletonBlock className="h-12 w-full max-w-2xl" />
          <SkeletonBlock className="mt-8 h-10 w-64" />
          <SkeletonBlock className="mt-6 h-[520px] w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (query.isError) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export default App;
