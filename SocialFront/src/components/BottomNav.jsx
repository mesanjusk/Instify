import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import AppsIcon from '@mui/icons-material/Apps';
import { useLocation, useNavigate } from 'react-router-dom';

export default function BottomNav({ username }) {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const tabs = [
    { label: 'Home', icon: <HomeIcon />, path: `/${username}` },
    { label: 'Students', icon: <PeopleIcon />, path: `/${username}/students` },
    { label: 'Admissions', icon: <SchoolIcon />, path: `/${username}/allAdmission` },
    { label: 'WhatsApp', icon: <WhatsAppIcon sx={{ color: path.includes('whatsapp') ? '#25d366' : undefined }} />, path: `/${username}/whatsapp-personal` },
    { label: 'More', icon: <AppsIcon />, path: `/${username}/tools` },
  ];

  const currentTab = tabs.findIndex((t, i) => {
    if (i === 0) return path === `/${username}` || path === `/${username}/`;
    return path.startsWith(t.path);
  });

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1200,
        display: { xs: 'block', md: 'none' },
        borderRadius: 0,
        borderTop: '1px solid #e2e8f0',
      }}
      elevation={4}
    >
      <BottomNavigation
        value={currentTab === -1 ? false : currentTab}
        onChange={(_, val) => navigate(tabs[val].path)}
        showLabels
        sx={{ height: 60 }}
      >
        {tabs.map((tab, i) => (
          <BottomNavigationAction
            key={i}
            label={tab.label}
            icon={tab.icon}
            sx={{
              '&.Mui-selected': { color: 'primary.main' },
              fontSize: '0.65rem',
              minWidth: 0,
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
