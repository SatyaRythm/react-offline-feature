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
import EventIcon from '@mui/icons-material/Event';
import BusinessIcon from '@mui/icons-material/Business';
import { assessmentApi, accountApi } from '../../services/api';
import { Assessment, Account } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

const AssessmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [filteredAssessments, setFilteredAssessments] = useState<Assessment[]>([]);
  const [accounts, setAccounts] = useState<Record<string, Account>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch assessments on component mount
  useEffect(() => {
    fetchAssessments();
  }, []);

  // Filter assessments when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredAssessments(assessments);
    } else {
      const lowercaseSearch = searchTerm.toLowerCase();
      const filtered = assessments.filter(
        assessment => 
          assessment.name.toLowerCase().includes(lowercaseSearch) ||
          (accounts[assessment.accountId]?.Name.toLowerCase().includes(lowercaseSearch))
      );
      setFilteredAssessments(filtered);
    }
  }, [assessments, searchTerm, accounts]);

  // Fetch assessments from API
  const fetchAssessments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await assessmentApi.getAssessments();
      setAssessments(data);
      setFilteredAssessments(data);
      
      // Fetch accounts to display account names
      const accountsData = await accountApi.getAccounts();
      const accountsMap: Record<string, Account> = {};
      accountsData.forEach((account: Account) => {
        if (account.id) {
          accountsMap[account.id] = account;
        }
      });
      setAccounts(accountsMap);
    } catch (err) {
      console.error('Failed to fetch assessments:', err);
      setError('Failed to load assessments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle assessment selection
  const handleAssessmentClick = (assessment: Assessment) => {
    if (assessment.id) {
      navigate(`/assessments/${assessment.id}`);
    }
  };

  // Create new assessment
  const handleCreateAssessment = () => {
    navigate('/assessments/new');
  };

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'default';
      case 'Sent':
        return 'primary';
      case 'In Progress':
        return 'warning';
      case 'Completed':
        return 'success';
      default:
        return 'default';
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading assessments..." />;
  }

  if (error) {
    return <ErrorMessage message={error} retry={fetchAssessments} />;
  }

  return (
    <Container maxWidth="sm">
      <Box mb={2}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search assessments..."
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
          onClick={handleCreateAssessment}
          fullWidth
        >
          Create New Assessment
        </Button>
      </Box>

      {filteredAssessments.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" align="center" color="textSecondary">
              {searchTerm ? 'No assessments match your search' : 'No assessments found. Create your first assessment!'}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <List disablePadding>
            {filteredAssessments.map((assessment, index) => (
              <React.Fragment key={assessment.id || index}>
                {index > 0 && <Divider />}
                <ListItem 
                  component="div" 
                  onClick={() => handleAssessmentClick(assessment)} 
                  sx={{ cursor: 'pointer' }}
                >
                  <ListItemText
                    primary={assessment.name}
                    secondary={
                      <>
                        <Box display="flex" alignItems="center" mt={0.5} mb={0.5}>
                          <BusinessIcon fontSize="small" sx={{ mr: 0.5 }} />
                          <Typography variant="body2" component="span">
                            {accounts[assessment.accountId]?.Name || 'Unknown Account'}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center">
                          <EventIcon fontSize="small" sx={{ mr: 0.5 }} />
                          <Typography variant="body2" component="span">
                            Due: {new Date(assessment.dueDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Box mt={1}>
                          <Chip 
                            label={assessment.status} 
                            size="small" 
                            color={getStatusColor(assessment.status) as any}
                            variant="outlined"
                          />
                        </Box>
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={() => handleAssessmentClick(assessment)}>
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
};

export default AssessmentsPage; 