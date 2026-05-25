import { Box, Paper } from '@mui/material';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import AppsRoundedIcon from '@mui/icons-material/AppsRounded';
import { useLocation, useNavigate } from 'react-router-dom';

const tabs = (username) => [
  { label: 'Home',      icon: HomeRoundedIcon,    path: `/${username}` },
  { label: 'Academic',  icon: SchoolRoundedIcon,  path: `/${username}/section/academic` },
  { label: 'WhatsApp',  icon: WhatsAppIcon,        path: `/${username}/section/whatsapp`, accent: '#25d366' },
  { label: 'Documents', icon: BadgeRoundedIcon,   path: `/${username}/section/canvas` },
  { label: 'Admin',     icon: AppsRoundedIcon,    path: `/${username}/section/admin` },
];

export default function BottomNav({ username }) {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const navTabs = tabs(username);
  const currentTab = navTabs.findIndex((t, i) => {
    if (i === 0) return path === `/${username}` || path === `/${username}/`;
    return path.startsWith(t.path);
  });

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        zIndex: 1200,
        display: { xs: 'block', md: 'none' },
        borderRadius: 0,
        borderTop: '1px solid rgba(226,232,240,0.6)',
        bgcolor: 'rgba(255,255,255,0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      <Box sx={{
        display: 'flex',
        height: 64,
        px: 1,
      }}>
        {navTabs.map((tab, i) => {
          const active = currentTab === i;
          const Icon = tab.icon;
          const iconColor = active
            ? (tab.accent || '#059669')
            : '#94a3b8';

          return (
            <Box
              key={i}
              onClick={() => navigate(tab.path)}
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                gap: 0.5,
                borderRadius: 2,
                transition: 'all 0.18s ease',
                py: 1,
                position: 'relative',
                '&:hover': { bgcolor: 'rgba(5,150,105,0.06)' },
                '&:active': { transform: 'scale(0.94)' },
              }}
            >
              {/* Active indicator pill */}
              {active && (
                <Box sx={{
                  position: 'absolute',
                  top: 8,
                  width: 32, height: 3,
                  borderRadius: 99,
                  bgcolor: tab.accent || '#059669',
                  animation: 'scaleIn 0.2s ease',
                  boxShadow: `0 0 8px ${tab.accent || '#059669'}80`,
                }} />
              )}

              <Box sx={{
                width: 36, height: 36,
                borderRadius: 2.5,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: active ? `${tab.accent || '#059669'}12` : 'transparent',
                transition: 'background 0.18s ease',
                mt: active ? 1 : 0,
              }}>
                <Icon sx={{
                  fontSize: 22,
                  color: iconColor,
                  transition: 'color 0.18s ease',
                }} />
              </Box>

              <Box
                component="span"
                sx={{
                  fontSize: '0.6rem',
                  fontWeight: active ? 700 : 500,
                  color: active ? (tab.accent || '#059669') : '#94a3b8',
                  letterSpacing: '0.01em',
                  lineHeight: 1,
                  transition: 'color 0.18s ease',
                }}
              >
                {tab.label}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}
