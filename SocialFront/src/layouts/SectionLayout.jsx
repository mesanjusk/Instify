/**
 * SectionLayout — full-screen isolated layout for app sections.
 * No sidebar, no FAB. Minimal header with back arrow + title.
 * Used for: WhatsApp, Document Maker, Academic Hub, Admin Hub.
 */

import { AppBar, Box, IconButton, Stack, Toolbar, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { Outlet, useNavigate, useParams } from 'react-router-dom';

export default function SectionLayout({ title, color = '#4f46e5', subtitle, children }) {
  const navigate = useNavigate();
  const { username } = useParams();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', bgcolor: 'background.default' }}>
      {/* Header */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: color,
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          borderBottom: 'none',
        }}
      >
        <Toolbar sx={{ gap: 1, minHeight: { xs: 52, sm: 60 }, px: { xs: 1.5, sm: 2 } }}>
          <IconButton
            edge="start"
            onClick={() => navigate(`/${username}`)}
            sx={{
              color: '#fff',
              mr: 0.5,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
            }}
          >
            <ArrowBackIosNewIcon fontSize="small" />
          </IconButton>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#fff', lineHeight: 1.2 }} noWrap>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', display: 'block', lineHeight: 1 }} noWrap>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {children ?? <Outlet />}
      </Box>
    </Box>
  );
}
