import React, { useState } from "react";
import { Box, Button, Fab, Stack, Typography } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';

const FloatingButtons = ({ buttonsList = [], direction = "up" }) => {
  const [isOpen, setIsOpen] = useState(false);

  const renderActions = () => {
    if (buttonsList.length === 0) {
      return (
        <Typography variant="caption" color="common.white">
          No actions
        </Typography>
      );
    }

    return buttonsList.map((button, index) => (
      <Button
        key={index}
        onClick={() => {
          button.onClick();
          setIsOpen(false);
        }}
        aria-label={button.label || `Action ${index + 1}`}
        title={button.label || ''}
        variant="contained"
        color="success"
        fullWidth
        sx={{
          width: 160,
          height: 48,
          borderRadius: 999,
          fontWeight: 600,
          bgcolor: 'common.white',
          color: 'success.dark',
          boxShadow: 6,
          '&:hover': {
            bgcolor: 'success.light',
            color: 'success.dark',
            transform: 'scale(1.03)'
          },
          transition: 'transform 0.2s ease'
        }}
      >
        {button.label}
      </Button>
    ));
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 80,
        right: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: (theme) => theme.zIndex.tooltip + 1,
      }}
    >
      {isOpen && (
        <Stack
          spacing={1.5}
          direction="column"
          sx={{
            mb: 2,
            alignItems: 'center',
            flexDirection: direction === 'up' ? 'column-reverse' : 'column',
            transition: 'all 0.3s ease-out'
          }}
        >
          {renderActions()}
        </Stack>
      )}

      <Fab
        color="success"
        aria-label="Toggle actions"
        onClick={() => setIsOpen((v) => !v)}
        sx={{
          boxShadow: 8,
          '&:hover': {
            bgcolor: 'success.dark',
            transform: 'rotate(90deg)'
          },
          transition: 'transform 0.2s ease'
        }}
      >
        <AddRoundedIcon />
      </Fab>
    </Box>
  );
};

export default FloatingButtons;
