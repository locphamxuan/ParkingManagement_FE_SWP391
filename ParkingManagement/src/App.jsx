import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useMatch, useNavigate } from 'react-router-dom';
import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import Toast from '@/components/layout/Toast';
import { Skeleton } from '@/components/ui/skeleton';
import { mainFlowModules } from '@/data/mainFlow';
import useAuthSession from '@/hooks/useAuthSession';
import AuthPage from '@/pages/AuthPage';
import DashboardPage from '@/pages/DashboardPage';
import HomePage from '@/pages/HomePage';
import AboutPage from '@/pages/AboutPage';
import ContactPage from '@/pages/ContactPage';

export default function App() {
  const [notice, setNotice] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const authRouteMatch = useMatch('/auth/:mode');
  const aboutRouteMatch = useMatch('/about');
  const contactRouteMatch = useMatch('/contact');

  const pushNotice = useCallback((message, type = 'info') => {
    setNotice({ message, type });
  }, []);

  const auth = useAuthSession({ onMessage: pushNotice });

  const isAuthenticated = Boolean(auth.session?.token);
  const isAuthRoute = Boolean(authRouteMatch);
  const isAboutRoute = Boolean(aboutRouteMatch);
  const isContactRoute = Boolean(contactRouteMatch);
  const authMode = authRouteMatch?.params?.mode === 'register' ? 'register' : 'login';

  const currentView = useMemo(() => {
    if (isAuthRoute) return 'auth';
    if (location.pathname === '/dashboard') return 'dashboard';
    if (isAboutRoute) return 'about';
    if (isContactRoute) return 'contact';
    return 'home';
  }, [isAuthRoute, isAboutRoute, isContactRoute, location.pathname]);

  useEffect(() => {
    if (!isAuthRoute && location.pathname === '/dashboard' && !isAuthenticated) {
      navigate('/', { replace: true });
      pushNotice('Bạn cần đăng nhập để vào bảng điều khiển.', 'error');
      return;
    }

    if (isAuthRoute && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isAuthRoute, location.pathname, navigate, pushNotice]);

  useEffect(() => {
    if (!notice?.message) return undefined;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  const navigateToHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const openAuth = useCallback(
    (mode = 'login') => {
      navigate(`/auth/${mode}`);
    },
    [navigate]
  );

  const openPage = useCallback(
    (path) => {
      navigate(path);
    },
    [navigate]
  );

  const openDashboard = useCallback(() => {
    if (!isAuthenticated) {
      pushNotice('Vui lòng đăng nhập trước.', 'error');
      openAuth('login');
      return;
    }
    navigate('/dashboard');
  }, [isAuthenticated, navigate, openAuth, pushNotice]);

  const scrollToBuildings = useCallback(() => {
    document.getElementById('buildings-section')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleGlobalAction = useCallback(
    (module) => {
      if (module.id === 'auth') {
        openAuth('login');
        return;
      }

      if (module.id === 'profile') {
        openDashboard();
        return;
      }

      if (module.id === 'buildings') {
        openDashboard();
        setTimeout(scrollToBuildings, 120);
        return;
      }

      pushNotice(`Chức năng "${module.title}" đang được phát triển.`, 'error');
    },
    [openAuth, openDashboard, pushNotice, scrollToBuildings]
  );

  const handleLogout = useCallback(() => {
    auth.logout();
    navigate('/');
    pushNotice('Đã đăng xuất.', 'success');
  }, [auth, navigate, pushNotice]);

  const handleAuthSubmit = useCallback(
    async ({ mode, payload }) => {
      const session =
        mode === 'login' ? await auth.login(payload) : await auth.register(payload);
      navigate('/dashboard');
      return session;
    },
    [auth, navigate]
  );

  const headerActions = useMemo(() => {
    const actions = [];

    if (isAuthenticated) {
      if (currentView !== 'dashboard') {
        actions.push({ key: 'dashboard', label: 'Bảng điều khiển', onClick: openDashboard });
      }
      actions.push({ key: 'logout', label: 'Đăng xuất', onClick: handleLogout });
      return actions;
    }

    actions.push(
      { key: 'login', label: 'Đăng nhập', onClick: () => openAuth('login') },
      { key: 'register', label: 'Đăng ký', onClick: () => openAuth('register') }
    );
    return actions;
  }, [currentView, handleLogout, isAuthenticated, openAuth, openDashboard]);

  if (auth.isBootstrapping) {
    return (
      <div className="page-surface flex min-h-screen flex-col">
        <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-8">
          <Skeleton className="h-14 w-full rounded-md" />
          <Skeleton className="h-48 w-full rounded-md" />
          <Skeleton className="h-64 w-full rounded-md" />
        </div>
      </div>
    );
  }

  if (isAuthRoute) {
    return (
      <>
        <AuthPage
          mode={authMode}
          notice={notice}
          onModeChange={openAuth}
          onBackHome={navigateToHome}
          onSubmit={handleAuthSubmit}
          isLoading={auth.isLoading}
        />
        <Toast message={notice?.message} type={notice?.type} onDismiss={() => setNotice(null)} />
      </>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header
        currentView={currentView}
        session={auth.session}
        actions={headerActions}
        onNavigate={openPage}
        onNavigateDashboard={openDashboard}
      />

      {currentView === 'home' && (
        <HomePage
          modules={mainFlowModules}
          onOpenAuth={openAuth}
          onOpenDashboard={openDashboard}
          onAction={handleGlobalAction}
        />
      )}

      {currentView === 'about' && <AboutPage onOpenAuth={openAuth} />}
      {currentView === 'contact' && <ContactPage />}

      {currentView === 'dashboard' && (
        <DashboardPage
          user={auth.session?.user}
          onLogout={handleLogout}
          onRefresh={auth.refreshProfile}
          modules={mainFlowModules}
          onAction={handleGlobalAction}
          isProfileLoading={auth.isLoading}
        />
      )}

      {!['/', '/dashboard', '/about', '/contact'].includes(location.pathname) && <Navigate to="/" replace />}

      <Footer />

      <Toast message={notice?.message} type={notice?.type} onDismiss={() => setNotice(null)} />
    </div>
  );
}
