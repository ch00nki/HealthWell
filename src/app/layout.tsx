import type { Metadata } from "next";
import { Providers } from './providers';
import NavigationWrapper from '@/components/NavigationWrapper';
import BackgroundProvider from './backgroundProvider';

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
      <body suppressHydrationWarning>
        {/* <Box
          sx={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 45%,rgb(213, 106, 225) 120%)',
            
            minHeight: '100vh',
            backgroundColor: '#1A202C',
            backgroundImage: `
              linear-gradient(90deg, #1A202C 25%, #2D3748 25%, #2D3748 50%, #1A202C 50%, #1A202C 75%, #2D3748 75%, #2D3748 100%),
              linear-gradient(#1A202C 25%, #2D3748 25%, #2D3748 50%, #1A202C 50%, #1A202C 75%, #2D3748 75%, #2D3748 100%)
            `,
            backgroundSize: '70px 70px',
            backgroundBlendMode: 'difference', // ✅ combine both gradients correctly
          }}
        > */}
        <BackgroundProvider>
          <Providers>
            <NavigationWrapper>
              {children}
            </NavigationWrapper>
          </Providers>
        </BackgroundProvider>
        {/* </Box> */}
      </body>
    </html>
  );
}
