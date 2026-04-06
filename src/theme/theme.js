import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary:    { main: '#FF6B35', light: '#FF8C5A', dark: '#E54E1B' },
    secondary:  { main: '#FFD166', light: '#FFE09A', dark: '#E6B800' },
    background: { default: '#0D0D1A', paper: '#16162A' },
    success:    { main: '#06D6A0' },
    error:      { main: '#EF476F' },
    info:       { main: '#118AB2' },
    text:       { primary: '#F0F0FA', secondary: '#9898B8' },
  },
  typography: {
    fontFamily: '"Outfit", "Helvetica", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-1px' },
    h2: { fontWeight: 800, letterSpacing: '-0.5px' },
    h3: { fontWeight: 700, letterSpacing: '-0.5px' },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    button: { fontFamily: '"Outfit", sans-serif', fontWeight: 600 },
    overline: { fontFamily: '"Outfit", sans-serif', letterSpacing: '0.12em', fontSize: '0.6rem', fontWeight: 700 },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 700,
          fontSize: '0.95rem',
          padding: '11px 24px',
          transition: 'transform 0.1s ease, box-shadow 0.2s ease',
          '&:active': { transform: 'scale(0.97)' },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #FF6B35 0%, #FF8C5A 100%)',
          boxShadow: '0 6px 24px rgba(255,107,53,0.28)',
          '&:hover': { boxShadow: '0 8px 32px rgba(255,107,53,0.42)' },
          '&:disabled': { background: 'rgba(255,107,53,0.2)', color: 'rgba(255,255,255,0.3)', boxShadow: 'none' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          backgroundImage: 'none',
          border: '1px solid rgba(255,255,255,0.06)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: { padding: 0, width: 42, height: 24, borderRadius: 12 },
        switchBase: {
          padding: 3,
          '&.Mui-checked': {
            transform: 'translateX(18px)',
            color: '#fff',
            '& + .MuiSwitch-track': {
              opacity: 1,
              background: 'linear-gradient(90deg, #FF6B35, #FFD166)',
              border: 'none',
            },
          },
        },
        thumb: { width: 18, height: 18, boxShadow: '0 2px 6px rgba(0,0,0,0.3)' },
        track: {
          opacity: 1,
          backgroundColor: 'rgba(255,255,255,0.12)',
          borderRadius: 12,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 99, overflow: 'hidden' },
        bar:  { borderRadius: 99 },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1A1A30',
          backgroundImage: 'none',
          borderRadius: 24,
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
        },
        root: {
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
          },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.88rem',
          borderRadius: 8,
          mx: '4px',
          '&:hover': { backgroundColor: 'rgba(255,255,255,0.06)' },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'transform 0.1s ease, background-color 0.15s ease',
          '&:active': { transform: 'scale(0.9)' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          fontSize: '0.72rem',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontFamily: '"Outfit", sans-serif' },
      },
    },
  },
});

export default theme;
