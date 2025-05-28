import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Home as HomeIcon, 
         Person as PersonIcon, 
         Assignment as AssignmentIcon } from '@mui/icons-material';
import { BottomNavigation, BottomNavigationAction, Paper, Snackbar, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

// Components
import Header from './components/Header';

// Pages
import AccountsPage from './pages/Accounts/AccountsPage';
import AccountDetailPage from './pages/Accounts/AccountDetailPage';
import AccountFormPage from './pages/Accounts/AccountFormPage';
import ContactsPage from './pages/Contacts/ContactsPage';
import ContactDetailPage from './pages/Contacts/ContactDetailPage';
import ContactFormPage from './pages/Contacts/ContactFormPage';
import AssessmentsPage from './pages/Assessments/AssessmentsPage';
import AssessmentDetailPage from './pages/Assessments/AssessmentDetailPage';
import AssessmentFormPage from './pages/Assessments/AssessmentFormPage';
import AssessmentResponsePage from './pages/Assessments/AssessmentResponsePage';

// Create a theme with Salesforce-like colors
const theme = createTheme({
  palette: {
    primary: {
      main: '#0176d3', // Salesforce blue
    },
    secondary: {
      main: '#1b96ff', // Salesforce secondary blue
    },
    background: {
      default: '#f3f3f3',
    },
  },
  typography: {
    fontFamily: '"Salesforce Sans", "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontSize: '1.75rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '4px',
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});

function App() {
  const currentPath = window.location.pathname;
  const [showUpdateAlert, setShowUpdateAlert] = useState(false);

  // Register service worker with update notification
  useEffect(() => {
    serviceWorkerRegistration.register({
      onUpdate: (registration) => {
        setShowUpdateAlert(true);
      }
    });
  }, []);

  // Function to update the service worker
  const handleServiceWorkerUpdate = () => {
    serviceWorkerRegistration.updateServiceWorker();
    setShowUpdateAlert(false);
    // Reload the page after a short delay to apply updates
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppContent currentPath={currentPath} />
      </Router>
      
      {/* Service Worker Update Notification */}
      <Snackbar
        open={showUpdateAlert}
        message="New version available!"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        action={
          <Button color="primary" size="small" onClick={handleServiceWorkerUpdate}>
            Update
          </Button>
        }
      />
    </ThemeProvider>
  );
}

// Create a separate component that uses useNavigate inside Router context
function AppContent({ currentPath }: { currentPath: string }) {
  const navigate = useNavigate();
  
  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <main style={{ flex: 1, padding: '16px', paddingBottom: '72px' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/accounts" replace />} />
          
          {/* Account Routes */}
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/accounts/new" element={<AccountFormPage />} />
          <Route path="/accounts/:id" element={<AccountDetailPage />} />
          <Route path="/accounts/:id/edit" element={<AccountFormPage />} />
          <Route path="/accounts/:accountId/contacts/new" element={<ContactFormPage />} />
          
          {/* Contact Routes */}
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/contacts/new" element={<ContactFormPage />} />
          <Route path="/contacts/:id" element={<ContactDetailPage />} />
          <Route path="/contacts/:id/edit" element={<ContactFormPage />} />

          {/* Assessment Routes */}
          <Route path="/assessments" element={<AssessmentsPage />} />
          <Route path="/assessments/new" element={<AssessmentFormPage />} />
          <Route path="/assessments/:id" element={<AssessmentDetailPage />} />
          <Route path="/assessments/:id/edit" element={<AssessmentFormPage />} />
          <Route path="/assessments/:id/respond" element={<AssessmentResponsePage />} />
        </Routes>
      </main>
      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
        <BottomNavigation
          value={currentPath}
          onChange={(event, newValue) => {
            navigate(newValue);
          }}
          showLabels
        >
          <BottomNavigationAction 
            label="Accounts" 
            value="/accounts" 
            icon={<HomeIcon />} 
          />
          <BottomNavigationAction 
            label="Contacts" 
            value="/contacts" 
            icon={<PersonIcon />} 
          />
          <BottomNavigationAction 
            label="Assessments" 
            value="/assessments" 
            icon={<AssignmentIcon />} 
          />
        </BottomNavigation>
      </Paper>
    </div>
  );
}

export default App;
