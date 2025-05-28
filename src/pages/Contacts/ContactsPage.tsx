import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  InputAdornment,
  Button,
  Chip,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import StorageIcon from '@mui/icons-material/Storage';
import { offlineContactApi } from '../../services/offlineApi';
import { Contact } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import connectivityService from '../../services/connectivity';

const ContactsPage: React.FC = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Subscribe to connectivity changes
  useEffect(() => {
    const unsubscribe = connectivityService.subscribe((online) => {
      setIsOnline(online);
    });
    
    return () => unsubscribe();
  }, []);

  // Fetch contacts on component mount
  useEffect(() => {
    fetchContacts();
  }, []);

  // Filter contacts when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredContacts(contacts);
    } else {
      const lowercaseSearch = searchTerm.toLowerCase();
      const filtered = contacts.filter(
        contact => 
          contact.FirstName.toLowerCase().includes(lowercaseSearch) ||
          contact.LastName.toLowerCase().includes(lowercaseSearch) ||
          `${contact.FirstName} ${contact.LastName}`.toLowerCase().includes(lowercaseSearch) ||
          (contact.Email && contact.Email.toLowerCase().includes(lowercaseSearch)) ||
          (contact.Phone && contact.Phone.includes(searchTerm)) ||
          (contact.Title && contact.Title.toLowerCase().includes(lowercaseSearch))
      );
      setFilteredContacts(filtered);
    }
  }, [contacts, searchTerm]);

  // Fetch contacts from API
  const fetchContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await offlineContactApi.getContacts();
      setContacts(data);
      setFilteredContacts(data);
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
      setError('Failed to load contacts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle contact selection
  const handleContactClick = (contactId: string) => {
    navigate(`/contacts/${contactId}`);
  };

  // Create new contact
  const handleCreateContact = () => {
    navigate('/contacts/new');
  };

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // Check if a contact is stored locally (temporary ID)
  const isLocalContact = (contact: Contact): boolean => {
    return contact.id?.startsWith('local_') || false;
  };

  if (loading) {
    return <LoadingSpinner message="Loading contacts..." />;
  }

  if (error) {
    return <ErrorMessage message={error} retry={fetchContacts} />;
  }

  return (
    <Container maxWidth="sm">
      <Box mb={2}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          size="small"
        />
      </Box>

      <Box mb={2}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateContact}
          fullWidth
        >
          Create New Contact
        </Button>
      </Box>

      {filteredContacts.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" align="center" color="textSecondary">
              {searchTerm ? 'No contacts match your search' : 'No contacts found. Create your first contact!'}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <List disablePadding>
            {filteredContacts.map((contact, index) => (
              <React.Fragment key={contact.id || index}>
                {index > 0 && <Divider />}
                <ListItem component="div" onClick={() => handleContactClick(contact.id || '')} sx={{ cursor: 'pointer' }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography component="span">{`${contact.FirstName} ${contact.LastName}`}</Typography>
                        {isLocalContact(contact) && (
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
                        <Box mt={0.5}>
                          {contact.Email && (
                            <Chip
                              icon={<EmailIcon fontSize="small" />}
                              label={contact.Email}
                              size="small"
                              variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          )}
                          {contact.Phone && (
                            <Chip
                              icon={<PhoneIcon fontSize="small" />}
                              label={contact.Phone}
                              size="small"
                              variant="outlined"
                              sx={{ mb: 0.5 }}
                            />
                          )}
                        </Box>
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
    </Container>
  );
}

export default ContactsPage; 