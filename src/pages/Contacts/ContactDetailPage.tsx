import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Divider,
  Paper,
  Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import BusinessIcon from '@mui/icons-material/Business';
import WorkIcon from '@mui/icons-material/Work';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StorageIcon from '@mui/icons-material/Storage';
import { offlineContactApi, offlineAccountApi } from '../../services/offlineApi';
import { Contact, Account } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import connectivityService from '../../services/connectivity';

const ContactDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [contact, setContact] = useState<Contact | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Subscribe to connectivity changes
  useEffect(() => {
    const unsubscribe = connectivityService.subscribe((online) => {
      setIsOnline(online);
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (id) {
      fetchContact(id);
    }
  }, [id]);

  const fetchContact = async (contactId: string) => {
    setLoading(true);
    setError(null);
    try {
      const contactData = await offlineContactApi.getContact(contactId);
      setContact(contactData || null);
      
      // If contact has an associated account, fetch it
      if (contactData && contactData.AccountId) {
        try {
          const accountData = await offlineAccountApi.getAccount(contactData.AccountId);
          setAccount(accountData || null);
        } catch (accountErr) {
          console.error('Failed to fetch associated account:', accountErr);
          // Not setting an error here since the contact data is still available
        }
      }
    } catch (err) {
      console.error('Failed to fetch contact:', err);
      setError('Failed to load contact details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (id) {
      navigate(`/contacts/${id}/edit`);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    setLoading(true);
    setDeleteDialogOpen(false);
    try {
      await offlineContactApi.deleteContact(id);
      navigate('/contacts');
    } catch (err) {
      console.error('Failed to delete contact:', err);
      setError('Failed to delete contact. Please try again.');
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const openDeleteDialog = () => {
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };

  // Check if an item is stored locally (temporary ID)
  const isLocalItem = (item: Account | Contact): boolean => {
    return item.id?.startsWith('local_') || false;
  };

  if (loading) {
    return <LoadingSpinner message="Loading contact details..." />;
  }

  if (error) {
    return <ErrorMessage message={error} retry={() => id && fetchContact(id)} />;
  }

  if (!contact) {
    return (
      <Container maxWidth="sm">
        <Box mt={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" align="center">
                Contact not found
              </Typography>
              <Box mt={2} textAlign="center">
                <Button variant="contained" color="primary" onClick={handleBack}>
                  Go Back
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box mt={2} mb={3}>
        <IconButton onClick={handleBack} edge="start" aria-label="back">
          <ArrowBackIcon />
        </IconButton>
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h5">
                {contact.FirstName} {contact.LastName}
              </Typography>
              {isLocalItem(contact) && (
                <Chip
                  icon={<StorageIcon fontSize="small" />}
                  label="Local"
                  size="small"
                  color="warning"
                  sx={{ height: 20, fontSize: '0.6rem' }}
                />
              )}
            </Box>
            <Box>
              <IconButton color="primary" onClick={handleEdit} aria-label="edit">
                <EditIcon />
              </IconButton>
              <IconButton color="error" onClick={openDeleteDialog} aria-label="delete">
                <DeleteIcon />
              </IconButton>
            </Box>
          </Box>

          {contact.Title && (
            <Box display="flex" alignItems="center" mb={1}>
              <WorkIcon color="action" sx={{ mr: 1, fontSize: 20 }} />
              <Typography variant="body1">{contact.Title}</Typography>
            </Box>
          )}

          {contact.Department && (
            <Box display="flex" alignItems="center" mb={1}>
              <BusinessIcon color="action" sx={{ mr: 1, fontSize: 20 }} />
              <Typography variant="body1">{contact.Department}</Typography>
            </Box>
          )}

          {contact.Email && (
            <Box display="flex" alignItems="center" mb={1}>
              <EmailIcon color="action" sx={{ mr: 1, fontSize: 20 }} />
              <Typography variant="body1">
                <a href={`mailto:${contact.Email}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  {contact.Email}
                </a>
              </Typography>
            </Box>
          )}

          {contact.Phone && (
            <Box display="flex" alignItems="center" mb={1}>
              <PhoneIcon color="action" sx={{ mr: 1, fontSize: 20 }} />
              <Typography variant="body1">
                <a href={`tel:${contact.Phone}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  {contact.Phone}
                </a>
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {account && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" gutterBottom>
                Related Account
              </Typography>
              {isLocalItem(account) && (
                <Chip
                  icon={<StorageIcon fontSize="small" />}
                  label="Local"
                  size="small"
                  color="warning"
                  sx={{ height: 20, fontSize: '0.6rem' }}
                />
              )}
            </Box>
            <Box 
              sx={{ 
                p: 2, 
                bgcolor: 'background.default', 
                borderRadius: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                cursor: 'pointer',
              }}
              onClick={() => navigate(`/accounts/${account.id}`)}
            >
              <Typography variant="subtitle1">
                {account.Name}
              </Typography>
              {account.Industry && (
                <Typography variant="body2" color="text.secondary">
                  {account.Industry}
                </Typography>
              )}
              {account.Phone && (
                <Box display="flex" alignItems="center">
                  <PhoneIcon color="action" sx={{ mr: 1, fontSize: 'small' }} />
                  <Typography variant="body2">
                    {account.Phone}
                  </Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {(contact.MailingStreet || contact.MailingCity || contact.MailingState) && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Address
            </Typography>
            <Box display="flex" alignItems="flex-start">
              <LocationOnIcon color="action" sx={{ mr: 1, mt: 0.5 }} />
              <Box>
                {contact.MailingStreet && (
                  <Typography variant="body1">{contact.MailingStreet}</Typography>
                )}
                <Typography variant="body1">
                  {[
                    contact.MailingCity,
                    contact.MailingState,
                    contact.MailingPostalCode
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </Typography>
                {contact.MailingCountry && (
                  <Typography variant="body1">{contact.MailingCountry}</Typography>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Delete Contact</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this contact? This action cannot be undone.
            {!isOnline && (
              <Box mt={2}>
                <Typography color="warning.main">
                  You are currently offline. This contact will be marked for deletion and removed from the server when you are back online.
                </Typography>
              </Box>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ContactDetailPage; 