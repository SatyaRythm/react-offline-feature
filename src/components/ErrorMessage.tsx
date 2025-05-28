import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

interface ErrorMessageProps {
  message: string;
  retry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, retry }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        m: 2,
        borderRadius: 2,
        backgroundColor: 'rgba(244, 67, 54, 0.05)',
        border: '1px solid rgba(244, 67, 54, 0.2)',
      }}
    >
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        textAlign="center"
      >
        <ErrorOutlineIcon color="error" sx={{ fontSize: 48, mb: 2 }} />
        <Typography variant="h6" color="error" gutterBottom>
          Error
        </Typography>
        <Typography variant="body1" color="textSecondary" mb={2}>
          {message}
        </Typography>
        {retry && (
          <Button
            variant="outlined"
            color="primary"
            onClick={retry}
            sx={{ mt: 1 }}
          >
            Try Again
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default ErrorMessage; 