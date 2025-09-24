'use client';

import { Box } from '@mui/material';
import SignUpInfoForm from '@/components/auth/SignUpInfoForm';

export default function SignUpInfoPage() {
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
      <SignUpInfoForm />
    </Box>
  );
}
