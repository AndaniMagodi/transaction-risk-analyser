import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#f9fafb',
      paper: '#ffffff',
    },
    primary: {
      main: '#111827',
    },
    success: { main: '#16a34a' },
    warning: { main: '#eab308' },
    error: { main: '#dc2626' },
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h6: { fontWeight: 600, fontSize: '1rem' },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { border: '1px solid #e5e7eb' },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 500 },
      },
    },
  },
})
