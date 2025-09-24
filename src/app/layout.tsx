import type { Metadata } from "next";
import { Providers } from './providers';
import { AuthProvider } from '@/contexts/AuthContext';
import NavigationWrapper from '@/components/NavigationWrapper';

export const metadata: Metadata = {
  title: "HealthWell",
  description: "Your personal health and wellness companion",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AuthProvider>
            <NavigationWrapper>
              {children}
            </NavigationWrapper>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
