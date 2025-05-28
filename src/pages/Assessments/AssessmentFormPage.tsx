import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  IconButton,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { assessmentApi, accountApi, templateApi } from '../../services/api';
import { Account, Template } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

const AssessmentFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(
    new Date(new Date().setDate(new Date().getDate() + 30))
  );
  const [status, setStatus] = useState('Draft');

  const [templates, setTemplates] = useState<Template[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadFormData();
  }, [id]);

  const loadFormData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load templates
      const templatesData = await templateApi.getTemplates();
      setTemplates(templatesData);
      
      // Load accounts
      const accountsData = await accountApi.getAccounts();
      setAccounts(accountsData);
      
      // If edit mode, load assessment data
      if (isEditMode && id) {
        const assessmentData = await assessmentApi.getAssessment(id);
        setName(assessmentData.name);
        setTemplateId(assessmentData.templateId);
        setAccountId(assessmentData.accountId);
        setDueDate(assessmentData.dueDate ? new Date(assessmentData.dueDate) : null);
        setStatus(assessmentData.status);
      }
    } catch (err) {
      console.error('Failed to load form data:', err);
      setError('Failed to load necessary data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!templateId) {
      errors.templateId = 'Template is required';
    }
    
    if (!accountId) {
      errors.accountId = 'Account is required';
    }
    
    if (!dueDate) {
      errors.dueDate = 'Due date is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    try {
      const assessmentData = {
        name,
        templateId,
        accountId,
        dueDate: dueDate?.toISOString(),
        status,
      };
      
      if (isEditMode && id) {
        await assessmentApi.updateAssessment(id, assessmentData);
      } else {
        await assessmentApi.createAssessment(assessmentData);
      }
      
      navigate('/assessments');
    } catch (err) {
      console.error('Failed to save assessment:', err);
      setError('Failed to save assessment. Please try again.');
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return <LoadingSpinner message={isEditMode ? 'Loading assessment data...' : 'Loading form...'} />;
  }

  return (
    <Container maxWidth="sm">
      <Box mt={2} mb={3}>
        <IconButton onClick={handleBack} edge="start" aria-label="back">
          <ArrowBackIcon />
        </IconButton>
      </Box>

      <Typography variant="h5" component="h1" gutterBottom>
        {isEditMode ? 'Edit Assessment' : 'Create Assessment'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <TextField
              fullWidth
              label="Assessment Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              margin="normal"
              error={!!formErrors.name}
              helperText={formErrors.name}
              required
            />

            <FormControl fullWidth margin="normal" error={!!formErrors.templateId} required>
              <InputLabel id="template-label">Template</InputLabel>
              <Select
                labelId="template-label"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value as string)}
                label="Template"
              >
                {templates.map((template) => (
                  <MenuItem key={template.id} value={template.id}>
                    {template.name}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.templateId && <FormHelperText>{formErrors.templateId}</FormHelperText>}
            </FormControl>

            <FormControl fullWidth margin="normal" error={!!formErrors.accountId} required>
              <InputLabel id="account-label">Associated Customer</InputLabel>
              <Select
                labelId="account-label"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value as string)}
                label="Account"
              >
                {accounts.map((account) => (
                  <MenuItem key={account.id} value={account.id}>
                    {account.Name}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.accountId && <FormHelperText>{formErrors.accountId}</FormHelperText>}
            </FormControl>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Due Date"
                value={dueDate}
                onChange={(newValue) => setDueDate(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    margin: 'normal',
                    error: !!formErrors.dueDate,
                    helperText: formErrors.dueDate,
                    required: true,
                  },
                }}
              />
            </LocalizationProvider>

            <FormControl fullWidth margin="normal">
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                value={status}
                onChange={(e) => setStatus(e.target.value as string)}
                label="Status"
              >
                <MenuItem value="Draft">Draft</MenuItem>
                <MenuItem value="Sent">Sent</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </CardContent>
        </Card>

        <Box display="flex" justifyContent="space-between" mb={4}>
          <Button
            variant="outlined"
            onClick={handleBack}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Assessment'}
          </Button>
        </Box>
      </form>
    </Container>
  );
};

export default AssessmentFormPage; 