import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import AuthScreen from './components/Auth/AuthScreenModern';
import OnboardingFlow from './components/Onboarding/OnboardingFlow';
import Home from './components/Home/Home';
import CreateAlarm from './components/Alarm/CreateAlarm';
import WakeUpFlow from './components/WakeUp/WakeUpFlow';

function AppRoutes() {
  const { session, user, activeAlarm, loading, pendingOnboarding, showAuthDirectly } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base">
        <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    if (pendingOnboarding || showAuthDirectly) return <AuthScreen />;
    return <OnboardingFlow />;
  }

  if (activeAlarm) return <WakeUpFlow />;

  if (!user.onboardingComplete) return <OnboardingFlow />;

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/create-alarm" element={<CreateAlarm />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
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
