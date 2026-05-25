import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#059669',
      light: '#34d399',
      dark: '#064e3b',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f59e0b',
      light: '#fcd34d',
      dark: '#b45309',
      contrastText: '#1c1917',
    },
    success: {
      main: '#10b981',
      light: '#6ee7b7',
      dark: '#065f46',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#f59e0b',
      light: '#fcd34d',
      dark: '#d97706',
    },
    error: {
      main: '#ef4444',
      light: '#fca5a5',
      dark: '#b91c1c',
    },
    info: {
      main: '#3b82f6',
      light: '#93c5fd',
      dark: '#1d4ed8',
    },
    background: {
      default: '#f0fdf9',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#64748b',
    },
    divider: '#e2e8f0',
  },
  typography: {
    fontFamily: '"Inter", "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1 },
    h2: { fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2 },
    h3: { fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.25 },
    h4: { fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.3 },
    h5: { fontWeight: 700, letterSpacing: '-0.015em', lineHeight: 1.35 },
    h6: { fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.4 },
    subtitle1: { fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.005em' },
    subtitle2: { fontWeight: 600, lineHeight: 1.5 },
    body1: { lineHeight: 1.7, color: '#334155' },
    body2: { lineHeight: 1.6, color: '#64748b' },
    button: { fontWeight: 600, textTransform: 'none', letterSpacing: '-0.01em' },
    caption: { lineHeight: 1.5, color: '#94a3b8', letterSpacing: '0.01em' },
    overline: { letterSpacing: '0.1em', fontWeight: 700 },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0 1px 2px rgba(15,23,42,0.04)',
    '0 1px 4px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
    '0 2px 8px rgba(15,23,42,0.08), 0 1px 3px rgba(15,23,42,0.04)',
    '0 4px 12px rgba(15,23,42,0.10), 0 2px 4px rgba(15,23,42,0.05)',
    '0 6px 16px rgba(15,23,42,0.12), 0 3px 6px rgba(15,23,42,0.06)',
    '0 8px 24px rgba(15,23,42,0.12), 0 4px 8px rgba(15,23,42,0.06)',
    '0 10px 28px rgba(15,23,42,0.14), 0 5px 10px rgba(15,23,42,0.07)',
    '0 12px 32px rgba(15,23,42,0.16), 0 6px 12px rgba(15,23,42,0.08)',
    '0 14px 36px rgba(15,23,42,0.18), 0 7px 14px rgba(15,23,42,0.09)',
    '0 16px 40px rgba(15,23,42,0.18), 0 8px 16px rgba(15,23,42,0.09)',
    '0 18px 44px rgba(15,23,42,0.20), 0 9px 18px rgba(15,23,42,0.10)',
    '0 20px 48px rgba(15,23,42,0.20), 0 10px 20px rgba(15,23,42,0.10)',
    '0 22px 52px rgba(15,23,42,0.22), 0 11px 22px rgba(15,23,42,0.11)',
    '0 24px 56px rgba(15,23,42,0.22), 0 12px 24px rgba(15,23,42,0.11)',
    '0 26px 60px rgba(15,23,42,0.22), 0 13px 26px rgba(15,23,42,0.11)',
    '0 28px 64px rgba(15,23,42,0.24), 0 14px 28px rgba(15,23,42,0.12)',
    '0 30px 68px rgba(15,23,42,0.24), 0 15px 30px rgba(15,23,42,0.12)',
    '0 32px 72px rgba(15,23,42,0.24), 0 16px 32px rgba(15,23,42,0.12)',
    '0 34px 76px rgba(15,23,42,0.26), 0 17px 34px rgba(15,23,42,0.13)',
    '0 36px 80px rgba(15,23,42,0.26), 0 18px 36px rgba(15,23,42,0.13)',
    '0 38px 84px rgba(15,23,42,0.26), 0 19px 38px rgba(15,23,42,0.13)',
    '0 40px 88px rgba(15,23,42,0.28), 0 20px 40px rgba(15,23,42,0.14)',
    '0 44px 96px rgba(15,23,42,0.28), 0 22px 44px rgba(15,23,42,0.14)',
    '0 48px 104px rgba(15,23,42,0.30), 0 24px 48px rgba(15,23,42,0.15)',
  ],
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true, variant: 'contained' },
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 10,
          padding: '9px 20px',
          fontSize: '0.875rem',
          letterSpacing: '-0.01em',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': { transform: 'translateY(-1px)' },
          '&:active': { transform: 'translateY(0)' },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
          boxShadow: '0 4px 14px rgba(5,150,105,0.35)',
          '&:hover': {
            background: 'linear-gradient(135deg, #047857 0%, #059669 100%)',
            boxShadow: '0 6px 20px rgba(5,150,105,0.45)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #f59e0b 0%, #fcd34d 100%)',
          color: '#1c1917',
          boxShadow: '0 4px 14px rgba(245,158,11,0.35)',
          '&:hover': {
            background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
            boxShadow: '0 6px 20px rgba(245,158,11,0.45)',
          },
        },
        outlined: {
          borderColor: '#059669',
          color: '#059669',
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
            backgroundColor: 'rgba(5,150,105,0.06)',
            transform: 'translateY(-1px)',
          },
        },
        containedError: {
          background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
          boxShadow: '0 4px 14px rgba(239,68,68,0.30)',
          '&:hover': {
            background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
            boxShadow: '0 6px 20px rgba(239,68,68,0.40)',
          },
        },
        sizeSmall: { padding: '6px 14px', fontSize: '0.8125rem', borderRadius: 8 },
        sizeLarge: { padding: '12px 28px', fontSize: '1rem', borderRadius: 12 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid rgba(226,232,240,0.8)',
          boxShadow: '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
          transition: 'box-shadow 0.25s ease, transform 0.25s ease',
          backgroundColor: '#ffffff',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 16, backgroundImage: 'none' },
        elevation0: { boxShadow: 'none' },
        elevation1: { boxShadow: '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)' },
        elevation2: { boxShadow: '0 4px 12px rgba(15,23,42,0.08), 0 2px 4px rgba(15,23,42,0.05)' },
        elevation3: { boxShadow: '0 6px 16px rgba(15,23,42,0.10), 0 3px 6px rgba(15,23,42,0.06)' },
        elevation4: { boxShadow: '0 8px 24px rgba(15,23,42,0.12), 0 4px 8px rgba(15,23,42,0.06)' },
        elevation6: { boxShadow: '0 12px 32px rgba(15,23,42,0.14), 0 6px 12px rgba(15,23,42,0.07)' },
        elevation8: { boxShadow: '0 16px 40px rgba(15,23,42,0.16), 0 8px 16px rgba(15,23,42,0.08)' },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: '#f8fafc',
            transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
            '& fieldset': { borderColor: '#e2e8f0', borderWidth: '1.5px' },
            '&:hover': { backgroundColor: '#f1f5f9' },
            '&:hover fieldset': { borderColor: '#94a3b8' },
            '&.Mui-focused': { backgroundColor: '#ffffff' },
            '&.Mui-focused fieldset': {
              borderColor: '#059669',
              borderWidth: '2px',
              boxShadow: '0 0 0 3px rgba(5,150,105,0.12)',
            },
            '&.Mui-error fieldset': { borderColor: '#ef4444' },
          },
          '& .MuiInputLabel-root': { color: '#64748b', fontWeight: 500 },
          '& .MuiInputLabel-root.Mui-focused': { color: '#059669' },
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
          fontWeight: 600,
          fontSize: '0.72rem',
          letterSpacing: '0.01em',
        },
        colorSuccess: { backgroundColor: '#d1fae5', color: '#065f46' },
        colorError: { backgroundColor: '#fee2e2', color: '#991b1b' },
        colorWarning: { backgroundColor: '#fef3c7', color: '#92400e' },
        colorInfo: { backgroundColor: '#dbeafe', color: '#1e40af' },
        colorDefault: { backgroundColor: '#f1f5f9', color: '#475569' },
        colorPrimary: { backgroundColor: '#d1fae5', color: '#065f46' },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: 'none',
          color: '#0f172a',
          borderBottom: '1px solid rgba(226,232,240,0.7)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#071a0e',
          backgroundImage: 'none',
          borderRight: 'none',
          boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          boxShadow: '0 24px 64px rgba(15,23,42,0.20)',
        },
        backdrop: {
          backgroundColor: 'rgba(15,23,42,0.55)',
          backdropFilter: 'blur(4px)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          fontSize: '1.1rem',
          color: '#0f172a',
          letterSpacing: '-0.01em',
          paddingBottom: 8,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontWeight: 700,
            fontSize: '0.72rem',
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            color: '#64748b',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #f1f5f9',
          fontSize: '0.875rem',
          padding: '12px 16px',
          color: '#334155',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.15s ease',
          '&:hover': { backgroundColor: '#f8fafc' },
          '&:last-child td': { borderBottom: 0 },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: '#f1f5f9' },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { backgroundColor: '#e2e8f0', borderRadius: 99, height: 6 },
        bar: { background: 'linear-gradient(90deg, #059669, #34d399)', borderRadius: 99 },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: { color: '#059669' },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 12, fontWeight: 500, border: '1px solid transparent' },
        standardSuccess: {
          backgroundColor: '#f0fdf4',
          color: '#065f46',
          borderColor: '#bbf7d0',
          '& .MuiAlert-icon': { color: '#059669' },
        },
        standardWarning: {
          backgroundColor: '#fffbeb',
          color: '#92400e',
          borderColor: '#fde68a',
          '& .MuiAlert-icon': { color: '#f59e0b' },
        },
        standardError: {
          backgroundColor: '#fff1f2',
          color: '#991b1b',
          borderColor: '#fecaca',
          '& .MuiAlert-icon': { color: '#ef4444' },
        },
        standardInfo: {
          backgroundColor: '#eff6ff',
          color: '#1e40af',
          borderColor: '#bfdbfe',
          '& .MuiAlert-icon': { color: '#3b82f6' },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: '#059669',
          fontWeight: 500,
          '&:hover': { color: '#047857' },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: 'all 0.15s ease',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: 'all 0.15s ease',
          '&:hover': { backgroundColor: 'rgba(15,23,42,0.06)' },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: { fontWeight: 700 },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          height: 64,
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          minWidth: 0,
          padding: '6px 0',
          transition: 'color 0.2s ease',
          '&.Mui-selected': { color: '#059669' },
        },
        label: {
          fontSize: '0.62rem',
          fontWeight: 600,
          letterSpacing: '0.01em',
          '&.Mui-selected': { fontSize: '0.62rem' },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#0f172a',
          borderRadius: 8,
          fontSize: '0.75rem',
          fontWeight: 500,
          padding: '6px 10px',
          boxShadow: '0 4px 12px rgba(15,23,42,0.15)',
        },
        arrow: { color: '#0f172a' },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: { fontWeight: 700, fontSize: '0.65rem' },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': { transform: 'scale(1.06)', boxShadow: '0 12px 32px rgba(0,0,0,0.22)' },
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        '*, *::before, *::after': { boxSizing: 'border-box' },
        html: { scrollBehavior: 'smooth' },
        body: {
          margin: 0,
          minHeight: '100vh',
          backgroundColor: '#f0fdf9',
          color: '#0f172a',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        '::-webkit-scrollbar': { width: 5, height: 5 },
        '::-webkit-scrollbar-track': { background: 'transparent' },
        '::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: 99 },
        '::-webkit-scrollbar-thumb:hover': { background: '#94a3b8' },
        'input::placeholder': { color: '#94a3b8' },
        'textarea::placeholder': { color: '#94a3b8' },
        '@keyframes fadeUp': {
          from: { opacity: 0, transform: 'translateY(14px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        '@keyframes fadeIn': {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        '@keyframes scaleIn': {
          from: { opacity: 0, transform: 'scale(0.94)' },
          to: { opacity: 1, transform: 'scale(1)' },
        },
        '@keyframes livePulse': {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.6, transform: 'scale(0.85)' },
        },
        '@keyframes shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        '@keyframes floatY': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
});

export default theme;
