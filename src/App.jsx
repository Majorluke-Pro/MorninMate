import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import AuthScreen from './components/Auth/AuthScreenModern';
import OnboardingFlow from './components/Onboarding/OnboardingFlow';
import Home from './components/Home/Home';
import CreateAlarm from './components/Alarm/CreateAlarm';
import WakeUpFlow from './components/WakeUp/WakeUpFlow';

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
  } = useApp();

  if (loading || !authInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base">
        <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (activeAlarm) return <WakeUpFlow />;

  const canUseApp = Boolean(session || offlineAccess || user.onboardingComplete);

  if (canUseApp && !user.onboardingComplete) {
    return <OnboardingFlow />;
  }

  if (canUseApp) {
    return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create-alarm" element={<CreateAlarm />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  if (!session) {
    if (pendingOnboarding || showAuthDirectly) return <AuthScreen />;
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
