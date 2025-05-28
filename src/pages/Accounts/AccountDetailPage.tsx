import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PhoneIcon from '@mui/icons-material/Phone';
import LanguageIcon from '@mui/icons-material/Language';
import BusinessIcon from '@mui/icons-material/Business';
import StorageIcon from '@mui/icons-material/Storage';
import { offlineAccountApi, offlineContactApi } from '../../services/offlineApi';
import { Account, Contact } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import connectivityService from '../../services/connectivity';

const AccountDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [account, setAccount] = useState<Account | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
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
      fetchAccountData(id);
    }
  }, [id]);

  const fetchAccountData = async (accountId: string) => {
    setLoading(true);
    setError(null);
    try {
      const accountData = await offlineAccountApi.getAccount(accountId);
      setAccount(accountData || null);
      
      // Fetch related contacts
      const contactsData = await offlineContactApi.getContactsByAccount(accountId);
      setContacts(contactsData);
    } catch (err) {
      console.error('Failed to fetch account details:', err);
      setError('Failed to load account details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAccount = () => {
    if (id) {
      navigate(`/accounts/${id}/edit`);
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!id) return;
    
    setDeleteDialogOpen(false);
    setLoading(true);
    
    try {
      await offlineAccountApi.deleteAccount(id);
      navigate('/accounts');
    } catch (err) {
      console.error('Failed to delete account:', err);
      setError('Failed to delete account. Please try again.');
      setLoading(false);
    }
  };

  const handleAddContact = () => {
    if (id) {
      navigate(`/accounts/${id}/contacts/new`);
    }
  };

  const handleContactClick = (contactId: string) => {
    navigate(`/contacts/${contactId}`);
  };

  // Check if an account or contact is stored locally (temporary ID)
  const isLocalItem = (item: Account | Contact): boolean => {
    return item.id?.startsWith('local_') || false;
  };

  if (loading) {
    return <LoadingSpinner message="Loading account details..." />;
  }

  if (error) {
    return <ErrorMessage message={error} retry={() => id && fetchAccountData(id)} />;
  }

  if (!account) {
    return <ErrorMessage message="Account not found" />;
  }

  return (
    <Container maxWidth="sm">
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h5" component="h1" gutterBottom>
                {account.Name}
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
            <Box>
              <IconButton size="small" onClick={handleEditAccount} sx={{ mr: 1 }}>
                <EditIcon />
              </IconButton>
              <IconButton size="small" onClick={handleDeleteClick} color="error">
                <DeleteIcon />
              </IconButton>
            </Box>
          </Box>

          {account.Industry && (
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {account.Industry}
            </Typography>
          )}

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {account.Phone && (
              <Box display="flex" alignItems="center">
                <PhoneIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                <Typography variant="body1">{account.Phone}</Typography>
              </Box>
            )}

            {account.Website && (
              <Box display="flex" alignItems="center">
                <LanguageIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                <Typography variant="body1">
                  <a href={account.Website.startsWith('http') ? account.Website : `https://${account.Website}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: 'inherit', textDecoration: 'none' }}
                  >
                    {account.Website}
                  </a>
                </Typography>
              </Box>
            )}

            {(account.BillingStreet || account.BillingCity || account.BillingState) && (
              <Box display="flex" alignItems="flex-start">
                <BusinessIcon fontSize="small" color="action" sx={{ mr: 1, mt: 0.5 }} />
                <Box>
                  {account.BillingStreet && (
                    <Typography variant="body1">{account.BillingStreet}</Typography>
                  )}
                  <Typography variant="body1">
                    {[
                      account.BillingCity,
                      account.BillingState,
                      account.BillingPostalCode
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </Typography>
                  {account.BillingCountry && (
                    <Typography variant="body1">{account.BillingCountry}</Typography>
                  )}
                </Box>
              </Box>
            )}
          </Box>

          {account.Description && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>Description</Typography>
              <Typography variant="body1">{account.Description}</Typography>
            </>
          )}
        </CardContent>
      </Card>

      <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Related Contacts</Typography>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddContact}
          size="small"
        >
          Add Contact
        </Button>
      </Box>

      {contacts.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" align="center" color="textSecondary">
              No contacts found for this account
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <List disablePadding>
            {contacts.map((contact, index) => (
              <React.Fragment key={contact.id || index}>
                {index > 0 && <Divider />}
                <ListItem component="div" onClick={() => handleContactClick(contact.id || '')} sx={{ cursor: 'pointer' }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography component="span">{`${contact.FirstName} ${contact.LastName}`}</Typography>
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
                    }
                    secondary={
                      <>
                        {contact.Title && <span>{contact.Title}</span>}
                        {contact.Email && (
                          <>
                            {contact.Title && <span> • </span>}
                            <span>{contact.Email}</span>
                          </>
                        )}
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={() => handleContactClick(contact.id || '')}>
                      <ChevronRightIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the account "{account.Name}"? This action cannot be undone.
            {!isOnline && (
              <Box mt={2}>
                <Typography color="warning.main">
                  You are currently offline. This account will be marked for deletion and removed from the server when you are back online.
                </Typography>
              </Box>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AccountDetailPage; 