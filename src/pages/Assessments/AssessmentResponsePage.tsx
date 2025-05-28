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
  Stepper,
  Step,
  StepLabel,
  TextField,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Checkbox,
  FormGroup,
  IconButton,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Stack,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { assessmentApi, templateApi, responseApi } from '../../services/api';
import { Assessment, Template, AssessmentResponse, TimelineEvent, QuestionResponse } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

const AssessmentResponsePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [response, setResponse] = useState<AssessmentResponse | null>(null);
  
  const [activeSection, setActiveSection] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [sectionCompleted, setSectionCompleted] = useState<boolean[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (id) {
      fetchData(id);
    }
  }, [id]);

  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  const fetchData = async (assessmentId: string) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch assessment
      const assessmentData = await assessmentApi.getAssessment(assessmentId);
      setAssessment(assessmentData);
      
      // Fetch template
      if (assessmentData.templateId) {
        const templateData = await templateApi.getTemplate(assessmentData.templateId);
        setTemplate(templateData);
        
        // Initialize section completion status
        setSectionCompleted(new Array(templateData.sections.length).fill(false));
      }
      
      // Check if there's a response
      try {
        const responses = await responseApi.getResponses();
        const existingResponse = responses.find((r: AssessmentResponse) => r.assessmentId === assessmentId);
        
        if (existingResponse) {
          setResponse(existingResponse);
          
          // Initialize answers from existing responses
          const answerMap: Record<string, any> = {};
          existingResponse.responses.forEach((questionResponse: QuestionResponse) => {
            const key = `${questionResponse.sectionId}-${questionResponse.questionId}`;
            answerMap[key] = questionResponse.value;
          });
          setAnswers(answerMap);
          
          // Check which sections are complete
          if (template) {
            const completedSections = template.sections.map((section, index) => {
              const sectionQuestions = section.questions;
              const answeredQuestions = sectionQuestions.filter(q => {
                const key = `${section.id}-${q.id}`;
                return answerMap[key] !== undefined && answerMap[key] !== null && answerMap[key] !== '';
              });
              return answeredQuestions.length === sectionQuestions.length;
            });
            setSectionCompleted(completedSections);
          }
        } else {
          // Create a new response if none exists
          const newResponse = await responseApi.createResponse({
            assessmentId,
            accountId: assessmentData.accountId,
            status: 'Not Started',
            responses: []
          });
          setResponse(newResponse);
        }
      } catch (responseErr) {
        console.error('Failed to handle response:', responseErr);
      }
      
    } catch (err) {
      console.error('Failed to fetch assessment data:', err);
      setError('Failed to load assessment data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleSectionChange = (index: number) => {
    setActiveSection(index);
  };

  const handleNext = () => {
    if (template && activeSection < template.sections.length - 1) {
      setActiveSection(activeSection + 1);
    }
  };

  const handlePrevious = () => {
    if (activeSection > 0) {
      setActiveSection(activeSection - 1);
    }
  };

  const handleAnswerChange = async (sectionId: string, questionId: string, value: any, questionType: string) => {
    // Update local state
    const key = `${sectionId}-${questionId}`;
    const updatedAnswers = { ...answers, [key]: value };
    setAnswers(updatedAnswers);
    
    // Save to server
    if (!response?.id) return;
    
    setSaving(true);
    try {
      await responseApi.saveQuestionResponse(response.id, {
        questionId,
        sectionId,
        value
      });
      
      // Update response status if it was 'Not Started'
      if (response.status === 'Not Started') {
        const updatedResponse = await responseApi.getResponse(response.id);
        setResponse(updatedResponse);
      }
      
      setSaveSuccess(true);
    } catch (err) {
      console.error('Failed to save answer:', err);
      setError('Failed to save your answer. Please try again.');
    } finally {
      setSaving(false);
    }
    
    // Check if section is complete
    if (template) {
      const sectionIndex = template.sections.findIndex(s => s.id === sectionId);
      if (sectionIndex !== -1) {
        const section = template.sections[sectionIndex];
        const allQuestionsAnswered = section.questions.every(q => {
          const answerKey = `${sectionId}-${q.id}`;
          return updatedAnswers[answerKey] !== undefined && 
                 updatedAnswers[answerKey] !== null && 
                 updatedAnswers[answerKey] !== '';
        });
        
        const updatedSectionCompleted = [...sectionCompleted];
        updatedSectionCompleted[sectionIndex] = allQuestionsAnswered;
        setSectionCompleted(updatedSectionCompleted);
      }
    }
  };

  const handleSubmit = async () => {
    if (!response?.id) return;
    
    setSubmitting(true);
    try {
      await responseApi.submitResponse(response.id);
      const updatedResponse = await responseApi.getResponse(response.id);
      setResponse(updatedResponse);
      // Navigate back to assessment detail
      if (id) {
        navigate(`/assessments/${id}`);
      }
    } catch (err) {
      console.error('Failed to submit response:', err);
      setError('Failed to submit your response. Please try again.');
      setSubmitting(false);
    }
  };

  const renderQuestion = (sectionId: string, question: any) => {
    const key = `${sectionId}-${question.id}`;
    const value = answers[key] || '';
    
    switch (question.type) {
      case 'text':
        return (
          <TextField
            fullWidth
            variant="outlined"
            label={question.required ? `${question.text} *` : question.text}
            value={value}
            onChange={(e) => handleAnswerChange(sectionId, question.id, e.target.value, question.type)}
            margin="normal"
            multiline
            rows={3}
            required={question.required}
          />
        );
      case 'number':
        return (
          <TextField
            fullWidth
            variant="outlined"
            label={question.required ? `${question.text} *` : question.text}
            value={value}
            onChange={(e) => handleAnswerChange(sectionId, question.id, e.target.value, question.type)}
            margin="normal"
            type="number"
            required={question.required}
          />
        );
      case 'multipleChoice':
        return (
          <FormControl component="fieldset" fullWidth margin="normal">
            <Typography variant="body1" sx={{ mb: 1 }}>
              {question.required ? `${question.text} *` : question.text}
            </Typography>
            <RadioGroup
              value={value}
              onChange={(e) => handleAnswerChange(sectionId, question.id, e.target.value, question.type)}
            >
              {question.options?.map((option: string) => (
                <FormControlLabel
                  key={option}
                  value={option}
                  control={<Radio />}
                  label={option}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );
      case 'checkboxes':
        return (
          <FormControl component="fieldset" fullWidth margin="normal">
            <Typography variant="body1" sx={{ mb: 1 }}>
              {question.required ? `${question.text} *` : question.text}
            </Typography>
            <FormGroup>
              {question.options?.map((option: string) => {
                const checked = Array.isArray(value) ? value.includes(option) : false;
                return (
                  <FormControlLabel
                    key={option}
                    control={
                      <Checkbox
                        checked={checked}
                        onChange={(e) => {
                          const currentValue = Array.isArray(value) ? [...value] : [];
                          if (e.target.checked) {
                            currentValue.push(option);
                          } else {
                            const index = currentValue.indexOf(option);
                            if (index !== -1) {
                              currentValue.splice(index, 1);
                            }
                          }
                          handleAnswerChange(sectionId, question.id, currentValue, question.type);
                        }}
                      />
                    }
                    label={option}
                  />
                );
              })}
            </FormGroup>
          </FormControl>
        );
      default:
        return (
          <Typography variant="body1" color="error">
            Unsupported question type: {question.type}
          </Typography>
        );
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading assessment..." />;
  }

  if (error) {
    return <ErrorMessage message={error} retry={() => id && fetchData(id)} />;
  }

  if (!template || !assessment) {
    return <ErrorMessage message="Assessment template not found" />;
  }

  // If the response is already submitted, show a read-only view
  const isSubmitted = response?.status === 'Submitted';

  return (
    <Container maxWidth="md">
      <Box mt={2} mb={2} display="flex" justifyContent="space-between" alignItems="center">
        <IconButton onClick={handleBack} edge="start" aria-label="back">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6">
          {assessment.name}
        </Typography>
        <Box width={40}></Box> {/* Empty box for alignment */}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        {/* Left panel - Timeline */}
        <Box sx={{ width: { xs: '100%', md: '25%' } }}>
          <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Timeline</Typography>
            <List dense>
              {response?.timeline.map((event: TimelineEvent, index: number) => (
                <ListItem key={event.id || index} sx={{ py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    {event.status === 'Submitted' ? (
                      <CheckCircleIcon color="success" fontSize="small" />
                    ) : (
                      <FiberManualRecordIcon color="primary" fontSize="small" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={event.status}
                    secondary={new Date(event.date).toLocaleString()}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>

          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Sections</Typography>
            <List dense>
              {template.sections.map((section, index) => (
                <ListItem 
                  key={section.id || index}
                  component="div"
                  onClick={() => handleSectionChange(index)}
                  sx={{ 
                    cursor: 'pointer',
                    borderRadius: 1,
                    mb: 0.5,
                    bgcolor: activeSection === index ? 'action.selected' : 'transparent'
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    {sectionCompleted[index] ? (
                      <CheckCircleIcon color="success" fontSize="small" />
                    ) : (
                      <RadioButtonUncheckedIcon fontSize="small" />
                    )}
                  </ListItemIcon>
                  <ListItemText primary={section.title} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>

        {/* Right panel - Questions */}
        <Box sx={{ width: { xs: '100%', md: '75%' } }}>
          {saveSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Your answer has been saved
            </Alert>
          )}

          {isSubmitted ? (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  This assessment has been submitted
                </Typography>
                <Typography variant="body1">
                  Thank you for completing the assessment. Your responses have been recorded.
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                  Submitted on: {response?.submittedAt && new Date(response.submittedAt).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {template.sections[activeSection].title}
                  </Typography>
                  {template.sections[activeSection].description && (
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {template.sections[activeSection].description}
                    </Typography>
                  )}
                  <Divider sx={{ my: 2 }} />
                  
                  {template.sections[activeSection].questions.map((question, qIndex) => (
                    <Box key={question.id || qIndex} mb={3}>
                      {renderQuestion(template.sections[activeSection].id || '', question)}
                    </Box>
                  ))}
                </CardContent>
              </Card>

              <Box display="flex" justifyContent="space-between" mb={4}>
                <Button
                  variant="outlined"
                  onClick={handlePrevious}
                  disabled={activeSection === 0}
                >
                  Previous
                </Button>
                
                {activeSection < template.sections.length - 1 ? (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleSubmit}
                    disabled={submitting || !sectionCompleted.every(Boolean)}
                  >
                    {submitting ? 'Submitting...' : 'Submit Assessment'}
                  </Button>
                )}
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default AssessmentResponsePage; 