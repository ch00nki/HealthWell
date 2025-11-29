'use client';

import { Box } from '@mui/material';
import Navigation from '@/components/Navigation';
import { usePathname } from 'next/navigation';

export default function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/auth/');

  if (isAuthPage) {
    return (
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
        {children}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', bgcolor: 'transparent', minHeight: '100vh' }}>
      <Navigation />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          bgcolor: 'transparent'
        }}
      >
        <Box sx={{ minHeight: '64px' }} /> {/* Toolbar spacing */}
        {children}
      </Box>
    </Box>
  );
}
