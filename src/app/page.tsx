'use client';

import { Box } from "@mui/material";
import SymptomCheckCard from '@/components/symptom_check/SymptomCheckCard';
import MealCard from '@/components/meal_card/MealCard';
import ActivityCard from '@/components/activity_card/ActivityCard';
import GoalsCard from '@/components/goals/GoalsCard';
import RemindersCard from '@/components/reminders/RemindersCard';
import { useState } from 'react';

export default function HomePage() {
  const [symptomInput, setSymptomInput] = useState('');
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 1 }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        {/* Left column */}
        <Box sx={{ flex: { xs: '1', md: '2' }, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* AI Symptom Check */}
          <SymptomCheckCard
            value={symptomInput}
            onChange={e => setSymptomInput(e.target.value)}
            placeholder="Feeling sick? Write your symptoms here. E.g. 'I have had a sore throat and runny nose for 2 days. My appetite has also been smaller.'"
          />

          {/* New directional cards */}
          <MealCard />
          <ActivityCard />
        </Box>

        {/* Right column */}
        <Box sx={{ flex: { xs: '1', md: '1' }, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Goals Card */}
          <GoalsCard />

          {/* Reminders Card */}
          <RemindersCard />
        </Box>
      </Box>
    </Box>
  );
}
