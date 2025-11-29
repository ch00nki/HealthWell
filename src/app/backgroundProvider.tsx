'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Box } from '@mui/material';

// 🧠 Context + Provider in one file
type Background = 'gradient' | 'pattern' | 'darkgrid';

interface BackgroundContextType {
  background: Background;
  toggleBackground: () => void;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export const useBackground = () => {
  const context = useContext(BackgroundContext);
  if (!context) throw new Error('useBackground must be used within a BackgroundProvider');
  return context;
};

export default function BackgroundProvider({ children }: { children: ReactNode }) {
  const [background, setBackground] = useState<Background>('gradient');

  const toggleBackground = () => {
    setBackground(prev => {
      if (prev === 'gradient') return 'pattern';
      if (prev === 'pattern') return 'darkgrid';
      return 'gradient';
    });
  };

  // 🎨 Background styles
  const backgrounds: Record<string, any> = {
    gradient: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 45%, rgb(213, 106, 225) 120%)',
    },
    pattern: {
      backgroundColor: '#1A202C',
      backgroundImage: `
        linear-gradient(90deg, #1A202C 25%, #2D3748 25%, #2D3748 50%, #1A202C 50%, #1A202C 75%, #2D3748 75%, #2D3748 100%),
        linear-gradient(#1A202C 25%, #2D3748 25%, #2D3748 50%, #1A202C 50%, #1A202C 75%, #2D3748 75%, #2D3748 100%)
      `,
      backgroundSize: '70px 70px',
      backgroundBlendMode: 'difference',
    },
    darkgrid: {
      backgroundColor: '#121212',
      backgroundImage: 'radial-gradient(circle at 2px 2px, #444 2px, transparent 0)',
      backgroundSize: '40px 40px',
    },
  };

  return (
    <BackgroundContext.Provider value={{ background, toggleBackground }}>
      <Box sx={{ minHeight: '100vh', transition: 'background 0.6s ease', ...backgrounds[background] }}>
        {children}
      </Box>
    </BackgroundContext.Provider>
  );
}
