import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from './lib/motion-lite';
import { AppProvider, useApp } from './context/AppContext';
import AuthScreen from './components/Auth/AuthScreenModern';
import OnboardingFlow from './components/Onboarding/OnboardingFlow';
import Home from './components/Home/Home';
import CreateAlarm from './components/Alarm/CreateAlarm';
import WakeUpFlow from './components/WakeUp/WakeUpFlow';
import { LoadingScreen, LoadingScreenPreview } from './components/common/LoadingScreen';

const ACTIVE_LOADING_VARIANT = 'pulse';

function AppRoutes() {
  const {
    session,
    user,
    activeAlarm,
    loading,
    authInitialized,
    pendingOnboarding,
    showAuthDirectly,
    offlineAccess,
    cloudReachable,
    canContinueOffline,
  } = useApp();
  const location = useLocation();

  if (location.pathname === '/loader-preview') {
    return <LoadingScreenPreview />;
  }

  if (loading || !authInitialized) {
    return (
      <LoadingScreen
        variant={ACTIVE_LOADING_VARIANT}
        offlineAccess={offlineAccess}
        cloudReachable={cloudReachable}
        canUseOffline={canContinueOffline}
      />
    );
  }

  if (activeAlarm) return <WakeUpFlow />;

  if (showAuthDirectly) {
    return <AuthScreen />;
  }

  const canUseApp = Boolean(session || offlineAccess || user.onboardingComplete);

  if (canUseApp && !user.onboardingComplete) {
    return <OnboardingFlow />;
  }

  if (canUseApp) {
    return (
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/create-alarm" element={<CreateAlarm />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    );
  }

  if (!session) {
    if (pendingOnboarding) return <AuthScreen />;
    return <OnboardingFlow />;
  }
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
