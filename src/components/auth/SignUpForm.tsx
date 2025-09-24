'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  TextField,
  Typography,
  Link as MuiLink,
  Alert,
  Switch,
  FormControlLabel,
} from '@mui/material';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'doctor'>('user'); // Role state
  const [error, setError] = useState('');
  const router = useRouter();
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Sign up with role
      await signUp(email, password, role);
      router.push('/auth/signup-info');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  // Clear form when unmounting
  useEffect(() => {
    return () => {
      setEmail('');
      setPassword('');
      setError('');
    };
  }, []);

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <TextField
        margin="normal"
        required
        fullWidth
        id="email"
        label="Email Address"
        name="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label="Password"
        type="password"
        id="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {/* Doctor toggle switch */}
      <FormControlLabel
        control={
          <Switch
            checked={role === 'doctor'}
            onChange={(e) => setRole(e.target.checked ? 'doctor' : 'user')}
            color="primary"
          />
        }
        label="Doctor?"
        labelPlacement='start'
        sx={{ mt: 0.5, ml: 0.5 }}
      />

      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
      >
        Sign Up
      </Button>

      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body2">
          Already have an account?{' '}
          <Link href="/auth/login" style={{ textDecoration: 'none' }}>
            <MuiLink component="span" sx={{ cursor: 'pointer' }}>
              Sign In
            </MuiLink>
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}
