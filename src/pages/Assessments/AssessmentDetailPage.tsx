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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EventIcon from '@mui/icons-material/Event';
import BusinessIcon from '@mui/icons-material/Business';
import { assessmentApi, accountApi, templateApi, responseApi } from '../../services/api';
import { Assessment, Account, Template, AssessmentResponse } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

const AssessmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [response, setResponse] = useState<AssessmentResponse | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAssessmentData(id);
    }
  }, [id]);

  const fetchAssessmentData = async (assessmentId: string) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch assessment
      const assessmentData = await assessmentApi.getAssessment(assessmentId);
      setAssessment(assessmentData);
      
      // Fetch related account
      if (assessmentData.accountId) {
        try {
          const accountData = await accountApi.getAccount(assessmentData.accountId);
          setAccount(accountData);
        } catch (accountErr) {
          console.error('Failed to fetch account:', accountErr);
        }
      }
      
      // Fetch template
      if (assessmentData.templateId) {
        try {
          const templateData = await templateApi.getTemplate(assessmentData.templateId);
          setTemplate(templateData);
        } catch (templateErr) {
          console.error('Failed to fetch template:', templateErr);
        }
      }
      
      // Check if there's a response
      try {
        const responses = await responseApi.getResponses();
        const existingResponse = responses.find((r: AssessmentResponse) => r.assessmentId === assessmentId);
        if (existingResponse) {
          setResponse(existingResponse);
        }
      } catch (responseErr) {
        console.error('Failed to fetch responses:', responseErr);
      }
      
    } catch (err) {
      console.error('Failed to fetch assessment details:', err);
      setError('Failed to load assessment details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAssessment = () => {
    if (id) {
      navigate(`/assessments/${id}/edit`);
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
      await assessmentApi.deleteAssessment(id);
      navigate('/assessments');
    } catch (err) {
      console.error('Failed to delete assessment:', err);
      setError('Failed to delete assessment. Please try again.');
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleViewResponse = () => {
    if (id) {
      navigate(`/assessments/${id}/respond`);
    }
  };

  const handleCreateResponse = async () => {
    if (!assessment || !id) return;
    
    setLoading(true);
    try {
      // Create a new response
      const newResponse = await responseApi.createResponse({
        assessmentId: id,
        accountId: assessment.accountId,
        status: 'Not Started',
        responses: []
      });
      
      // Navigate to the response page
      navigate(`/assessments/${id}/respond`);
    } catch (err) {
      console.error('Failed to create response:', err);
      setError('Failed to create response. Please try again.');
      setLoading(false);
    }
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
    return <LoadingSpinner message="Loading assessment details..." />;
  }

  if (error) {
    return <ErrorMessage message={error} retry={() => id && fetchAssessmentData(id)} />;
  }

  if (!assessment) {
    return <ErrorMessage message="Assessment not found" />;
  }

  return (
    <Container maxWidth="sm">
      <Box mt={2} mb={3}>
        <IconButton onClick={handleBack} edge="start" aria-label="back">
          <ArrowBackIcon />
        </IconButton>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Typography variant="h5" component="h1" gutterBottom>
              {assessment.name}
            </Typography>
            <Box>
              <IconButton size="small" onClick={handleEditAssessment} sx={{ mr: 1 }}>
                <EditIcon />
              </IconButton>
              <IconButton size="small" onClick={handleDeleteClick} color="error">
                <DeleteIcon />
              </IconButton>
            </Box>
          </Box>

          <Box mt={1} mb={2}>
            <Chip 
              label={assessment.status} 
              color={getStatusColor(assessment.status) as any}
              variant="outlined"
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {account && (
              <Box display="flex" alignItems="center">
                <BusinessIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                <Typography variant="body1">
                  <span 
                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => navigate(`/accounts/${account.id}`)}
                  >
                    {account.Name}
                  </span>
                </Typography>
              </Box>
            )}

            <Box display="flex" alignItems="center">
              <EventIcon fontSize="small" color="action" sx={{ mr: 1 }} />
              <Typography variant="body1">
                Due Date: {new Date(assessment.dueDate).toLocaleDateString()}
              </Typography>
            </Box>
          </Box>

          {template && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>Template</Typography>
              <Typography variant="body1">{template.name}</Typography>
              {template.description && (
                <Typography variant="body2" color="textSecondary" mt={1}>
                  {template.description}
                </Typography>
              )}
              <Box mt={2}>
                <Typography variant="body2">
                  {template.sections.length} sections • {template.sections.reduce((count, section) => count + section.questions.length, 0)} questions
                </Typography>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      <Box mt={3}>
        {response ? (
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleViewResponse}
          >
            {response.status === 'Submitted' ? 'View Submitted Response' : 'Continue Response'}
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleCreateResponse}
            disabled={assessment.status === 'Draft'}
          >
            Respond to Assessment
          </Button>
        )}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Delete Assessment</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the assessment "{assessment.name}"? This action cannot be undone.
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

export default AssessmentDetailPage; 