import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeIcon from '@mui/icons-material/Home';
import ConnectivityStatus from './ConnectivityStatus';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  // Determine title based on current path
  const getTitle = () => {
    if (path === '/' || path === '/accounts') return 'SRCM';
    if (path.match(/^\/accounts\/new$/)) return 'New Account';
    if (path.match(/^\/accounts\/[^/]+\/edit$/)) return 'Edit Account';
    if (path.match(/^\/accounts\/[^/]+$/)) return 'Account Details';
    if (path === '/contacts') return 'SRCM';
    if (path.match(/^\/contacts\/new$/) || path.match(/^\/accounts\/[^/]+\/contacts\/new$/)) return 'New Contact';
    if (path.match(/^\/contacts\/[^/]+\/edit$/)) return 'Edit Contact';
    if (path.match(/^\/contacts\/[^/]+$/)) return 'Contact Details';
    return 'SRCM';
  };

  // Determine if back button should be shown
  const shouldShowBackButton = () => {
    return path !== '/' && path !== '/accounts' && path !== '/contacts';
  };

  // Handle back navigation
  const handleBack = () => {
    navigate(-1);
  };

  // Navigate to home
  const goHome = () => {
    navigate('/');
  };

  return (
    <AppBar position="sticky" color="primary">
      <Toolbar>
        {shouldShowBackButton() ? (
          <IconButton edge="start" color="inherit" onClick={handleBack} aria-label="back">
            <ArrowBackIcon />
          </IconButton>
        ) : (
          <IconButton edge="start" color="inherit" onClick={goHome} aria-label="home">
            <HomeIcon />
          </IconButton>
        )}
        <Box sx={{ flexGrow: 1, textAlign: 'center' }}>
          <Typography variant="h6" component="div">
            {getTitle()}
          </Typography>
        </Box>
        <Box>
          <ConnectivityStatus />
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 