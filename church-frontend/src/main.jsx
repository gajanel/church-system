import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import { ToastProvider } from './components/ui/Toast.jsx'
import './index.css'
import './i18n'
import App from './App.jsx'

/**
 * MUI "Ghost" Theme
 * MUI se usa solo para widgets complejos (Table, Dialog, DatePicker).
 * Los colores y tipografía son controlados por nuestro Design System (tokens.css).
 */
const theme = createTheme({
  palette: {
    primary:    { main: '#1e3a8a', light: '#2563eb', dark: '#1e40af', contrastText: '#fff' },
    secondary:  { main: '#0369a1', contrastText: '#fff' },
    success:    { main: '#16a34a' },
    error:      { main: '#dc2626' },
    warning:    { main: '#d97706' },
    text: {
      primary:   '#111827',
      secondary: '#6b7280',
      disabled:  '#9ca3af',
    },
    background: {
      default: '#f3f4f6',
      paper:   '#ffffff',
    },
    divider: '#e5e7eb',
  },
  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
    fontSize: 13,
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: 13,
    },
  },
  shape: { borderRadius: 6 },
  shadows: [
    'none',
    '0 1px 2px rgba(0,0,0,0.04)',
    '0 1px 3px rgba(0,0,0,0.06)',
    '0 4px 6px -1px rgba(0,0,0,0.07)',
    '0 10px 15px -3px rgba(0,0,0,0.08)',
    '0 20px 25px -5px rgba(0,0,0,0.08)',
    ...Array(19).fill('none'),
  ],
  components: {
    MuiCssBaseline: { styleOverrides: { body: { backgroundColor: '#f3f4f6' } } },
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderRadius: 6,
          '&:hover': { boxShadow: 'none' },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#f9fafb',
            color: '#6b7280',
            fontWeight: 700,
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            borderBottom: '1px solid #e5e7eb',
            padding: '10px 16px',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: 13,
          borderBottom: '1px solid #f3f4f6',
          padding: '11px 16px',
          color: '#111827',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: '#f9fafb' },
          '&:last-child td': { borderBottom: 0 },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily: "'Inter', sans-serif",
          fontWeight: 600,
          fontSize: 11,
          height: 22,
          borderRadius: 99,
        },
        label: { padding: '0 8px' },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            fontSize: 13,
            borderRadius: 6,
            '& fieldset': { borderColor: '#e5e7eb' },
            '&:hover fieldset': { borderColor: '#d1d5db' },
            '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
          },
        },
      },
    },
    MuiSelect: {
      defaultProps: { size: 'small' },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        rounded: { borderRadius: 8 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          borderRadius: 10,
          border: '1px solid #e5e7eb',
        },
      },
    },
  },
});

// ─── Professional Navigation Refresh Logic ───
// Detecta si la página se carga desde el caché del navegador (bfcache) 
// al presionar "atrás" y fuerza una recarga controlada si es necesario.
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    // Si la página viene del bfcache, recargamos la información
    // Esto asegura datos frescos sin penalizar la navegación inicial.
    console.log('Navegación detectada desde caché. Refrescando datos...');
    window.location.reload();
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastProvider>
        <App />
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
)
