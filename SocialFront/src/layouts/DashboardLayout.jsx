import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  AppBar, Avatar, Badge, Box, IconButton, Stack, Toolbar, Tooltip, Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import LogoutIcon from '@mui/icons-material/Logout';

import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import { useApp } from '../context/AppContext';

const DRAWER_WIDTH = 256;

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, institute } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const username = user?.username || location.pathname.split('/')[1] || 'admin';
  const instituteName = institute?.institute_name || localStorage.getItem('institute_title') || 'Instify';
  const roleLabel = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Dashboard';
  const initials = (user?.name || 'A').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      localStorage.removeItem('user');
      localStorage.removeItem('institute');
      navigate('/');
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Desktop sidebar (permanent) */}
      <Sidebar username={username} />

      {/* Mobile sidebar (drawer) */}
      <Sidebar
        username={username}
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* Main content column */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          ml: { md: `${DRAWER_WIDTH}px` },
          minWidth: 0,
        }}
      >
        {/* Top AppBar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{ bgcolor: 'background.paper', color: 'text.primary' }}
        >
          <Toolbar sx={{ gap: 1, minHeight: { xs: 56, sm: 64 } }}>
            {/* Hamburger for mobile */}
            <IconButton
              edge="start"
              onClick={() => setMobileOpen(true)}
              sx={{ display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>

            {/* Institute name */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={700} noWrap>
                {instituteName}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {roleLabel}
              </Typography>
            </Box>

            {/* Right actions */}
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Tooltip title="Notifications">
                <IconButton size="small">
                  <Badge badgeContent={0} color="error">
                    <NotificationsNoneIcon fontSize="small" />
                  </Badge>
                </IconButton>
              </Tooltip>

              <Tooltip title={user?.name || 'Profile'}>
                <Avatar
                  sx={{
                    width: 34,
                    height: 34,
                    bgcolor: 'primary.main',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate(`/${username}/user`)}
                >
                  {initials}
                </Avatar>
              </Tooltip>

              <Tooltip title="Logout">
                <IconButton size="small" onClick={handleLogout} color="error">
                  <LogoutIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Toolbar>
        </AppBar>

        {/* Page content */}
        <Box
          component="main"
          sx={{
            flex: 1,
            p: { xs: 2, md: 3 },
            pb: { xs: 10, md: 3 },
            overflowY: 'auto',
          }}
        >
          <Outlet />
        </Box>
      </Box>

      {/* Mobile bottom navigation */}
      <BottomNav username={username} />
    </Box>
  );
}
