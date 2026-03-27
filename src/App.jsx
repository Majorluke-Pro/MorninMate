import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme/theme';
import { AppProvider, useApp } from './context/AppContext';
import OnboardingFlow from './components/Onboarding/OnboardingFlow';
import Home from './components/Home/Home';
import CreateAlarm from './components/Alarm/CreateAlarm';
import WakeUpFlow from './components/WakeUp/WakeUpFlow';

function AppRoutes() {
  const { user, activeAlarm } = useApp();

  if (activeAlarm) {
    return <WakeUpFlow />;
  }

  if (!user.onboardingComplete) {
    return <OnboardingFlow />;
  }

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
