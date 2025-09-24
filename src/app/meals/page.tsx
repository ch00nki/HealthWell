'use client';

import { useState } from 'react';
import { Box, Stack } from '@mui/material';
import RecipeMakerCard from '@/components/recipe/RecipeMakerCard';
import RecipeList from '@/components/recipe/RecipeList'
import MealLogger from '@/components/recipe/MealLogger'
import MealProgress from '@/components/recipe/MealProgress';

export default function MealLogPage() {
  const [recipePrompt, setRecipePrompt] = useState('');

  return (
    // <Container maxWidth="xl" sx={{ py: 1 }} disableGutters>
      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' }, py:1,maxWidth:1200, mx:'auto' }}>
        {/* “I want to start at 60% width, but I’m flexible — 
        I can expand or shrink depending on size of the flex container.” */}
        <Box sx={{ flex: '1 1 60%' }}>
          <Stack spacing={3}>
            <MealProgress />
            <RecipeMakerCard
              value={recipePrompt}
              onChange={(e) => setRecipePrompt(e.target.value)}
              placeholder="What would you like to cook? Include any dietary restrictions or preferences."
            />
            <RecipeList />
          </Stack>
        </Box>
        <Box sx={{ 
          flex: '1 1 40%', 
          position: 'sticky',
          top: 73,
          // overflowY: 'auto',
          height: 'calc(97vh - 64px)'}}>
          <MealLogger />
        </Box>
      </Box>
    // </Container>
  );
}

