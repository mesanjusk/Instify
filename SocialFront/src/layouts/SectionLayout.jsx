/**
 * SectionLayout — full-screen isolated layout for app sections.
 * No sidebar, no bottom nav, no FAB. Just a colored header + back arrow.
 * Used for: WhatsApp, Document Maker, Academic Hub, Admin Hub.
 */

import { AppBar, Box, IconButton, Toolbar, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { useNavigate, useParams } from 'react-router-dom';

export default function SectionLayout({ title, color = '#4f46e5', subtitle, children }) {
  const navigate = useNavigate();
  const { username } = useParams();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', bgcolor: 'background.default' }}>
      {/* Minimal header — back arrow + title only */}
      <AppBar
        position="static"
        elevation={0}
        sx={{ bgcolor: color, flexShrink: 0 }}
      >
        <Toolbar sx={{ gap: 1, minHeight: { xs: 52, sm: 56 } }}>
          <IconButton
            edge="start"
            onClick={() => navigate(`/${username}`)}
            sx={{ color: '#fff', mr: 0.5 }}
          >
            <ArrowBackIosNewIcon fontSize="small" />
          </IconButton>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#fff', lineHeight: 1.2 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', display: 'block', lineHeight: 1 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Content fills remaining height, scrollable */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {children}
      </Box>
    </Box>
  );
}
