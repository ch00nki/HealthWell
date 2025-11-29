'use client';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { UserPresenceTracker } from '@/contexts/UserPresenceContext';

// function UserPresenceTracker({ children }: { children: React.ReactNode }) {
//   usePresenceTracker();
//   return <>{children}</>;
// }

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider>
        <AuthProvider>
          <UserPresenceTracker>
            {children}
          </UserPresenceTracker>
        </AuthProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
