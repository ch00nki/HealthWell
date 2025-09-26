'use client';

import { useState } from 'react';
import { Box, Stack } from '@mui/material';
import WorkoutMakerCard from '@/components/activity/WorkoutMakerCard';
import WorkoutList2 from '@/components/activity/WorkoutList2';
import ActivityLogger from '@/components/activity/ActivityLogger';
import ActivityProgress from '@/components/activity/ActivityProgress';
// The one that loads 20 at a time, with "load more" button can check to see if good.
// import ActivityProgress2 from '@/components/activity/ActivityProgress2';

export default function ActivityLogPage() {
  const [workoutPrompt, setWorkoutPrompt] = useState('');

  return (
    // <Container maxWidth="xl" sx={{ py: 1 }} disableGutters>
      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' }, py:1, maxWidth:1200, mx:'auto' }}>
        {/* “I want to start at 60% width, but I’m flexible — 
        I can expand or shrink depending on size of the flex container.” */}
        <Box sx={{ flex: '1 1 60%' }}>
          <Stack spacing={3}>
            <ActivityProgress />
            <WorkoutMakerCard
              value={workoutPrompt}
              onChange={(e) => setWorkoutPrompt(e.target.value)}
              placeholder="What type of workout are you looking for? Include any equipment or time constraints."
            />
            <WorkoutList2 />
          </Stack>
        </Box>
        <Box sx={{ 
          flex: '1 1 40%', 
          position: 'sticky',
          top: 73,
          // overflowY: 'auto',
          height: 'calc(97vh - 64px)'}}>
          <ActivityLogger />
        </Box>
      </Box>
    // </Container>
  );
}
