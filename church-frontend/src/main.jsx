import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import { ToastProvider } from './components/ui/Toast.jsx'
import './index.css'
import './i18n'
import App from './App.jsx'

/**
 * MUI Corporate Flat Theme
 * Navy Blue corporate primary · Dense · Flat · 4-6px radius
 */
const theme = createTheme({
  palette: {
    primary:   { main: '#1e3a5f', light: '#3b82f6', dark: '#0f2540', contrastText: '#fff' },
    secondary: { main: '#374151', contrastText: '#fff' },
    success:   { main: '#16a34a' },
    error:     { main: '#dc2626' },
    warning:   { main: '#d97706' },
    text: {
      primary:   '#111827',
      secondary: '#374151',
      disabled:  '#9CA3AF',
    },
    background: {
      default: '#F9FAFB',
      paper:   '#FFFFFF',
    },
    divider: '#E5E7EB',
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    fontSize: 13,
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: 13,
    },
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 4 },
  shadows: [
    'none',           // 0
    '0 1px 2px rgba(0,0,0,0.05)',   // 1
    '0 1px 3px rgba(0,0,0,0.07)',   // 2
    '0 2px 4px rgba(0,0,0,0.07)',   // 3
    '0 4px 8px rgba(0,0,0,0.08)',   // 4
    '0 8px 16px rgba(0,0,0,0.08)',  // 5
    ...Array(19).fill('none'),
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: '#F9FAFB' },
      },
    },

    /* ── Buttons — flat, 4px radius ── */
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderRadius: 4,
          fontWeight: 600,
          letterSpacing: 0,
          '&:hover': { boxShadow: 'none' },
        },
        containedPrimary: {
          background: '#1e3a5f',
          '&:hover': { background: '#16304f' },
        },
        sizeMedium: { padding: '6px 14px' },
        sizeSmall:  { padding: '4px 10px', fontSize: 12 },
      },
    },

    /* ── Tables — zebra striping ── */
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#F3F4F6',
            color: '#374151',
            fontWeight: 700,
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            borderBottom: '1px solid #E5E7EB',
            padding: '8px 12px',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: 13,
          borderBottom: '1px solid #F3F4F6',
          padding: '9px 12px',
          color: '#111827',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          /* Zebra striping */
          '&:nth-of-type(odd)':  { backgroundColor: '#FFFFFF' },
          '&:nth-of-type(even)': { backgroundColor: '#F9FAFB' },
          '&:hover':             { backgroundColor: '#EBF0F7 !important' },
          '&:last-child td':     { borderBottom: 0 },
        },
      },
    },

    /* ── Chips — flat 3px radius ── */
    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily: "'Inter', sans-serif",
          fontWeight: 600,
          fontSize: 11,
          height: 20,
          borderRadius: 3,
        },
        label: { padding: '0 7px' },
      },
    },

    /* ── Text fields — dense ── */
    MuiTextField: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            fontSize: 13,
            borderRadius: 4,
            '& fieldset':             { borderColor: '#E5E7EB' },
            '&:hover fieldset':       { borderColor: '#D1D5DB' },
            '&.Mui-focused fieldset': { borderColor: '#1e3a5f', borderWidth: '1.5px' },
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#1e3a5f',
          },
        },
      },
    },

    /* ── Select ── */
    MuiSelect: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        outlined: { borderRadius: 4 },
      },
    },

    /* ── Dialogs — flat ── */
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 6,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          border: '1px solid #E5E7EB',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: 15,
          fontWeight: 600,
          padding: '14px 20px',
          borderBottom: '1px solid #E5E7EB',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: { padding: '16px 20px' },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '12px 20px',
          borderTop: '1px solid #E5E7EB',
          gap: 8,
        },
      },
    },

    /* ── Paper ── */
    MuiPaper: {
      styleOverrides: {
        root:    { backgroundImage: 'none' },
        rounded: { borderRadius: 4 },
      },
    },

    /* ── Card ── */
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderRadius: 4,
          border: '1px solid #E5E7EB',
        },
      },
    },

    /* ── Tabs ── */
    MuiTabs: {
      styleOverrides: {
        root:      { borderBottom: '1px solid #E5E7EB', minHeight: 42 },
        indicator: { backgroundColor: '#1e3a5f', height: 2 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 42,
          fontSize: 13,
          fontWeight: 500,
          color: '#6B7280',
          padding: '0 16px',
          '&.Mui-selected': { color: '#1e3a5f', fontWeight: 600 },
        },
      },
    },

    /* ── Tooltip ── */
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#1F2937',
          fontSize: 12,
          borderRadius: 4,
          padding: '4px 10px',
        },
        arrow: { color: '#1F2937' },
      },
    },

    /* ── Alerts — flat ── */
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 4, fontSize: 13 },
      },
    },
  },
});

// Detect bfcache navigation
window.addEventListener('pageshow', (event) => {
  if (event.persisted) window.location.reload();
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
