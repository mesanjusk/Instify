import React, { useState } from "react";
import { Box, Button, Fab, Stack, useMediaQuery } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CloseIcon from '@mui/icons-material/Close';

const FloatingButtons = ({ buttonsList = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width:900px)');

  if (!buttonsList.length) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: { xs: 72, md: 28 },
        right: { xs: 16, md: 28 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        zIndex: (theme) => theme.zIndex.tooltip + 1,
        gap: 1,
      }}
    >
      {isOpen && (
        <Stack spacing={1} sx={{ mb: 1, alignItems: 'flex-end', flexDirection: 'column-reverse' }}>
          {buttonsList.map((button, index) => (
            <Button
              key={index}
              onClick={() => { button.onClick(); setIsOpen(false); }}
              variant="contained"
              size="small"
              sx={{
                borderRadius: 2,
                fontWeight: 600,
                bgcolor: '#fff',
                color: '#064e3b',
                boxShadow: 4,
                px: { xs: 1.5, md: 2 },
                whiteSpace: 'nowrap',
                minWidth: 'auto',
                fontSize: { xs: '0.78rem', md: '0.82rem' },
                '&:hover': { bgcolor: '#f0fdf4' },
              }}
            >
              {button.label}
            </Button>
          ))}
        </Stack>
      )}
      <Fab
        onClick={() => setIsOpen(v => !v)}
        sx={{
          bgcolor: '#25d366',
          color: '#fff',
          boxShadow: 6,
          width: { xs: 48, md: 52 },
          height: { xs: 48, md: 52 },
          '&:hover': { bgcolor: '#1ebe57' },
          transition: 'transform 0.2s ease',
          transform: isOpen ? 'rotate(45deg)' : 'none',
        }}
      >
        {isOpen ? <CloseIcon /> : <AddRoundedIcon />}
      </Fab>
    </Box>
  );
};

export default FloatingButtons;
