import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Paper,
  BottomNavigation as MuiBottomNavigation,
  BottomNavigationAction,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import ContactsIcon from '@mui/icons-material/Contacts';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { styled } from '@mui/material/styles';

const StyledBottomNavigation = styled(MuiBottomNavigation)(({ theme }) => ({
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 1000,
  borderTop: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
}));

const BottomNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  
  // Determine which tab is active
  const getActiveTab = () => {
    if (path === '/' || path.startsWith('/accounts')) {
      return 0;
    } else if (path.startsWith('/contacts')) {
      return 1;
    }
    return 0; // Default to accounts
  };

  return (
    <Paper elevation={3} square>
      <StyledBottomNavigation
        value={getActiveTab()}
        showLabels
      >
        <BottomNavigationAction
          label="Accounts"
          icon={<BusinessIcon />}
          onClick={() => navigate('/accounts')}
        />
        <BottomNavigationAction
          label="Contacts"
          icon={<ContactsIcon />}
          onClick={() => navigate('/contacts')}
        />
        <BottomNavigationAction
          label="Add New"
          icon={<AddCircleIcon color="primary" />}
          onClick={() => {
            // Determine what type of item to add based on current page
            if (path.startsWith('/contacts')) {
              navigate('/contacts/new');
            } else {
              navigate('/accounts/new');
            }
          }}
        />
      </StyledBottomNavigation>
    </Paper>
  );
};

export default BottomNavigation; 