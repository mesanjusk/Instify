import React, { useState } from 'react';
import { Box, Button, Fab, Stack } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

const FloatingButtons = ({ buttonsList = [] }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!buttonsList.length) return null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <Box
          onClick={() => setIsOpen(false)}
          sx={{
            position: 'fixed', inset: 0,
            bgcolor: 'rgba(15,23,42,0.3)',
            backdropFilter: 'blur(2px)',
            zIndex: (theme) => theme.zIndex.tooltip,
            animation: 'fadeIn 0.15s ease',
          }}
        />
      )}

      <Box
        sx={{
          position: 'fixed',
          bottom: { xs: 100, md: 28 },
          right: { xs: 20, md: 28 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          zIndex: (theme) => theme.zIndex.tooltip + 1,
          gap: 1,
        }}
      >
        {isOpen && (
          <Stack
            spacing={1}
            sx={{ mb: 1, alignItems: 'flex-end', flexDirection: 'column-reverse' }}
          >
            {buttonsList.map((button, index) => (
              <Box
                key={index}
                sx={{
                  animation: `fadeUp 0.2s ease ${index * 0.05}s both`,
                }}
              >
                <Button
                  onClick={() => { button.onClick(); setIsOpen(false); }}
                  variant="contained"
                  size="small"
                  sx={{
                    borderRadius: 3,
                    fontWeight: 600,
                    bgcolor: '#ffffff',
                    color: '#064e3b',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    px: 2.5,
                    py: 1,
                    whiteSpace: 'nowrap',
                    minWidth: 'auto',
                    fontSize: '0.825rem',
                    border: '1px solid rgba(5,150,105,0.15)',
                    '&:hover': {
                      bgcolor: '#f0fdf4',
                      transform: 'translateX(-3px)',
                      boxShadow: '0 10px 28px rgba(5,150,105,0.2)',
                    },
                    transition: 'all 0.18s ease',
                  }}
                >
                  {button.label}
                </Button>
              </Box>
            ))}
          </Stack>
        )}

        <Fab
          onClick={() => setIsOpen(v => !v)}
          sx={{
            background: isOpen
              ? 'linear-gradient(135deg, #ef4444, #f87171)'
              : 'linear-gradient(135deg, #059669, #34d399)',
            color: '#fff',
            width: { xs: 50, md: 54 },
            height: { xs: 50, md: 54 },
            boxShadow: isOpen
              ? '0 8px 28px rgba(239,68,68,0.45)'
              : '0 8px 28px rgba(5,150,105,0.4)',
            transform: isOpen ? 'rotate(45deg) scale(1.05)' : 'none',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: isOpen ? 'rotate(45deg) scale(1.1)' : 'scale(1.08)',
              boxShadow: isOpen
                ? '0 12px 36px rgba(239,68,68,0.5)'
                : '0 12px 36px rgba(5,150,105,0.5)',
            },
          }}
        >
          {isOpen ? <CloseRoundedIcon /> : <AddRoundedIcon />}
        </Fab>
      </Box>
    </>
  );
};

export default FloatingButtons;
