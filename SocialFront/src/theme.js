import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1a7a4a',
      light: '#34c97e',
      dark: '#0a1a0f',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#d4a017',
      light: '#f0c040',
      dark: '#b8860b',
      contrastText: '#1a1a1a',
    },
    success: {
      main: '#1b5e20',
      light: '#34c97e',
      dark: '#0a1a0f',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#d4a017',
      light: '#f0c040',
      dark: '#b8860b',
    },
    error: {
      main: '#c62828',
      light: '#ef9a9a',
      dark: '#8e0000',
    },
    background: {
      default: '#f4f9f6',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#555555',
    },
  },
  typography: {
    fontFamily: '"Inter", "Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, color: '#1a1a1a' },
    h2: { fontWeight: 700, color: '#1a1a1a' },
    h3: { fontWeight: 600, color: '#1a1a1a' },
    h4: { fontWeight: 600, color: '#1a1a1a' },
    h5: { fontWeight: 600, color: '#1a1a1a' },
    h6: { fontWeight: 600, color: '#1a1a1a' },
    body1: { color: '#555555' },
    body2: { color: '#555555' },
    caption: { color: '#888888' },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      defaultProps: {
        variant: 'contained',
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 10,
          fontWeight: 600,
          padding: '8px 20px',
        },
        sizeSmall: { padding: '5px 14px', fontSize: '0.8125rem' },
        sizeLarge: { padding: '11px 28px', fontSize: '1rem' },
        containedPrimary: {
          backgroundColor: '#1a7a4a',
          '&:hover': { backgroundColor: '#25a066' },
        },
        containedSecondary: {
          backgroundColor: '#d4a017',
          color: '#1a1a1a',
          '&:hover': { backgroundColor: '#f0c040' },
        },
        outlined: {
          borderColor: '#1a7a4a',
          color: '#1a7a4a',
          '&:hover': {
            backgroundColor: '#1a7a4a',
            color: '#ffffff',
            borderColor: '#1a7a4a',
          },
        },
        containedError: {
          backgroundColor: '#c62828',
          '&:hover': { backgroundColor: '#8e0000' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
          border: '1px solid #d0e8d0',
          borderLeft: '3px solid #1a7a4a',
          backgroundColor: '#ffffff',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 16, backgroundColor: '#ffffff' },
        elevation1: { boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: '#ffffff',
            '& fieldset': { borderColor: '#d0e8d0' },
            '&:hover fieldset': { borderColor: '#1a7a4a' },
            '&.Mui-focused fieldset': {
              borderColor: '#1a7a4a',
              boxShadow: '0 0 0 3px rgba(26,122,74,0.15)',
            },
            '&.Mui-error fieldset': { borderColor: '#c62828' },
          },
          '& .MuiInputLabel-root': { color: '#1a1a1a' },
          '& .MuiInputBase-input::placeholder': { color: '#888888' },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: { borderRadius: 10 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          fontSize: '0.75rem',
        },
        colorSuccess: {
          backgroundColor: '#e8f5e9',
          color: '#1a7a4a',
        },
        colorError: {
          backgroundColor: '#ffebee',
          color: '#c62828',
        },
        colorWarning: {
          backgroundColor: '#fff8e1',
          color: '#d4a017',
        },
        colorDefault: {
          backgroundColor: '#f4f9f6',
          color: '#555555',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: '1px solid #d0e8d0',
          backgroundColor: '#0a1a0f',
          color: '#ffffff',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#0a1a0f',
          color: '#ffffff',
          borderRight: '1px solid #1a7a4a',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 20, backgroundColor: '#ffffff' },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: { fontWeight: 700, fontSize: '1.1rem', color: '#1a1a1a' },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontWeight: 700,
            fontSize: '0.78rem',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: '#ffffff',
            backgroundColor: '#1a7a4a',
            borderBottom: '2px solid #d0e8d0',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #d0e8d0',
          fontSize: '0.875rem',
          padding: '10px 16px',
          color: '#555555',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: '#e8f5e9' },
          '&:last-child td': { borderBottom: 0 },
          '&:nth-of-type(even)': { backgroundColor: '#f4f9f6' },
          '&:nth-of-type(odd)': { backgroundColor: '#ffffff' },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: '#d0e8d0' },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { backgroundColor: '#d0e8d0' },
        bar: { backgroundColor: '#1a7a4a' },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: { color: '#1a7a4a' },
      },
    },
    MuiAlert: {
      styleOverrides: {
        standardSuccess: { backgroundColor: '#e8f5e9', color: '#1b5e20' },
        standardWarning: { backgroundColor: '#fff8e1', color: '#d4a017' },
        standardError: { backgroundColor: '#ffebee', color: '#c62828' },
        standardInfo: { backgroundColor: '#e3f2fd', color: '#1565c0' },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: '#1a7a4a',
          '&:hover': { color: '#25a066' },
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        '*, *::before, *::after': { boxSizing: 'border-box' },
        body: {
          margin: 0,
          minHeight: '100vh',
          backgroundColor: '#f4f9f6',
          color: '#1a1a1a',
        },
        '::-webkit-scrollbar': { width: 6, height: 6 },
        '::-webkit-scrollbar-track': { background: 'transparent' },
        '::-webkit-scrollbar-thumb': { background: '#d0e8d0', borderRadius: 99 },
        '::-webkit-scrollbar-thumb:hover': { background: '#1a7a4a' },
        'input::placeholder': { color: '#888888' },
        'textarea::placeholder': { color: '#888888' },
      },
    },
  },
});

export default theme;
