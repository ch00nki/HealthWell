'use client';

import SignUpForm from '@/components/auth/SignUpForm';
import { Box, Paper, Typography } from '@mui/material';

export default function SignUpPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 3,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 400,
          width: '100%',
          borderRadius: 2,
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Create an Account
        </Typography>
        <Typography variant="body1" align="center" sx={{ mb: 4 }}>
          Join HealthWell today <br />
          Your personal health and wellness companion
        </Typography>
        <SignUpForm />
      </Paper>
    </Box>
  );
}
