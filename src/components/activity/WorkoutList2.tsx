import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box, List, ListItem, 
  CircularProgress, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface Workout {
  id: string;
  title: string;
  exercises: { name: string; sets_reps: string }[];
  rest: string;
  safety: string[];
  time: string;
  calories_burned: string;
}

export default function WorkoutList2() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  // For accordion, expanded is workout id or false
  const [expanded, setExpanded] = useState<string | false>(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const userWorkoutsRef = collection(db, 'users', user.uid, 'workouts');
    const q = query(userWorkoutsRef, orderBy('title', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedWorkouts: Workout[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedWorkouts.push({
          id: doc.id,
          title: data.title,
          exercises: data.exercises,
          rest: data.rest,
          safety: data.safety,
          time: data.time,
          calories_burned: data.calories_burned,
        });
      });
      setWorkouts(fetchedWorkouts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAccordionChange = (workoutId: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? workoutId : false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" component="h2" color="primary.light" gutterBottom fontWeight={600}>
          My Saved Workouts
        </Typography>
        {workouts.length === 0 ? (
          <Typography color="text.secondary" align="center">
            No saved workouts yet
          </Typography>
        ) : (
          <Box>
            {workouts.map((workout) => (
              <Accordion
                key={workout.id}
                expanded={expanded === workout.id}
                onChange={handleAccordionChange(workout.id)}
                sx={{
                  mb: 1,
                  '&:before': {
                    display: 'none',
                  },
                  boxShadow: 'none',
                  border: 1.5,
                  borderColor: 'divider',
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls={`workout-${workout.id}-content`}
                  id={`workout-${workout.id}-header`}
                  sx={{
                    '&:hover': { bgcolor: 'action.hover' },
                    bgcolor: expanded === workout.id ? 'action.selected' : 'transparent', // highlight when open
                  }}
                >
                {workout.title && (
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {workout.title || 'Missing Workout Title'}
                  </Typography>
                )}
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ mb: 1}}>
                    <Typography variant="subtitle1" color="text.secondary" sx={{fontWeight:"bold"}} >
                      Exercises:
                    </Typography>
                    {/* decimal style type is number, disc is normal bullet pt */}
                    <List sx={{ listStyleType: 'decimal', pl: 2, pt:0 }}>
                      {Array.isArray(workout.exercises) && workout.exercises.length>0 ? (
                        workout.exercises.map((exercise, index) => (
                          <ListItem key={index} sx={{ display: 'list-item', pl: 0.5, py: 0.4 }}>
                            <Typography>
                              {exercise.name} — {exercise.sets_reps}
                              </Typography>
                          </ListItem>
                        ))
                      ) : (
                        <ListItem sx={{ pl: 0.5 ,py:0.4}}>
                          <Typography> No exercises provided </Typography>
                        </ListItem>
                      )}
                    </List>
                  </Box>
    
                  
                  <Box>
                    <Typography variant="subtitle1" color="text.secondary" sx={{fontWeight:"bold"}}>
                      Rest Periods:
                    </Typography>
                    <Typography paragraph sx={{ pl: 0.2 }}>
                      {workout.rest || "No rest period provided"}
                    </Typography>
                  </Box>
    
                  <Box>
                    <Typography variant="subtitle1" color="text.secondary" sx={{fontWeight:"bold"}}>
                      Estimated Time:
                    </Typography>
                    <Typography paragraph sx={{ pl: 0.2 }}>
                      {workout.time || "No estimated time provided"}
                    </Typography>
                  </Box>
                
                  <Box>
                    <Typography variant="subtitle1" color="text.secondary" sx={{fontWeight:"bold"}}>
                      Calories Burned:
                    </Typography>
                    <Typography paragraph sx={{ pl: 0.2 }}>
                      {workout.calories_burned || "No calories burned provided"}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle1" color="text.secondary" sx={{fontWeight:"bold"}}>
                      Safety Tips:
                    </Typography>
                    <List sx={{ listStyleType: 'decimal', pl: 2, pt:0 }}>
                      {Array.isArray(workout.safety) && workout.safety.length>0 ? (
                        workout.safety.map((tip, index) => (
                          <ListItem key={index} sx={{ display: 'list-item', pl: 0.5, py: 0.4 }}>
                            <Typography>{tip}</Typography>
                          </ListItem>
                        ))
                      ) : (
                        <ListItem sx={{ pl: 0.5, py:0.4 }}>
                          <Typography> No safety tips provided </Typography>
                        </ListItem>
                      )}
                    </List>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
