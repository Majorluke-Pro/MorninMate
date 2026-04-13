import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import theme from './theme/theme';
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
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(160deg, #08081A 0%, #14082A 55%, #0D0D1A 100%)',
      }}>
        <CircularProgress sx={{ color: '#FF6B35' }} />
      </Box>
    );
  }

  if (!session) {
    // Show auth if onboarding is done or user wants to sign in directly
    if (pendingOnboarding || showAuthDirectly) return <AuthScreen />;
    // Otherwise start with onboarding
    return <OnboardingFlow />;
  }

  if (activeAlarm) return <WakeUpFlow />;

  // Edge case: logged in but profile incomplete (e.g. OAuth user who closed app mid-onboarding)
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
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
