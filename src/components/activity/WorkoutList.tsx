import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box, List, ListItem, 
  Collapse, IconButton, Paper, CircularProgress } from '@mui/material';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

interface Workout {
  id: string;
  title: string;
  exercises: { name: string; sets_reps: string }[];
  rest: string;
  safety: string[];
  createdAt: any;
}

export default function WorkoutList() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const userWorkoutsRef = collection(db, 'users', user.uid, 'workouts');
    const q = query(userWorkoutsRef, orderBy('createdAt', 'desc'));

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
          createdAt: data.createdAt,
        });
      });
      setWorkouts(fetchedWorkouts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleToggle = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
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
        <List>
          {workouts.length === 0 ? (
            <Typography color="text.secondary" align="center">
              No saved workouts yet
            </Typography>
          ) : (
            workouts.map((workout) => (
              <Paper key={workout.id} elevation={1} sx={{ mb: 2 }}>
            {/* <Paper square variant="outlined" key={workout.id} elevation={1} sx={{ mb: 2 }}> */}
                <ListItem
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                  onClick={() => handleToggle(workout.id)}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    {workout.title}
                  </Typography>
                  <IconButton edge="end" size="small">
                    {expandedId === workout.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </ListItem>
                <Collapse in={expandedId === workout.id}>
                  <Box sx={{ p: 2 }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" color="text.secondary" sx={{fontWeight: "bold"}}>
                        Exercises:
                      </Typography>
                      <List sx={{ listStyleType: 'decimal', pl: 2, pt: 0 }}>
                        {workout.exercises.map((exercise, index) => (
                          <ListItem key={index} sx={{ display: 'list-item', pl: 0.5, py: 0.5 }}>
                            <Typography>
                              {exercise.name} — {exercise.sets_reps}
                            </Typography>
                          </ListItem>
                        ))}
                      </List>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" color="text.secondary" sx={{fontWeight: "bold"}}>
                        Rest Periods:
                      </Typography>
                      <Typography paragraph sx={{ pl: 0.5 }}>
                        {workout.rest}
                      </Typography>
                    </Box>

                    {workout.safety && workout.safety.length > 0 && (
                      <Box>
                        <Typography variant="subtitle1" color="text.secondary" sx={{fontWeight: "bold"}}>
                          Safety Tips:
                        </Typography>
                        <List sx={{ listStyleType: 'decimal', pl: 2, pt: 0 }}>
                          {workout.safety.map((tip, index) => (
                            <ListItem key={index} sx={{ display: 'list-item', pl: 0.5, py: 0.5 }}>
                              <Typography>{tip}</Typography>
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </Box>
                </Collapse>
              </Paper>
            ))
          )}
        </List>
      </CardContent>
    </Card>
  );
}
