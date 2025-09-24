  import React, { useEffect, useState } from 'react';
  import { Card, CardContent, Typography, TextField, Button, CircularProgress, Box, Select, MenuItem, List, ListItem, Divider, Paper } from '@mui/material';
  import { doc, collection, addDoc, onSnapshot, serverTimestamp, query, where, getDocs, getDoc, Timestamp } from 'firebase/firestore';
  import { db } from '@/lib/firebase';
  import { useAuth } from '@/contexts/AuthContext';
  import { set } from 'date-fns';

  // import { v4 as uuidv4 } from 'uuid';

  interface WorkoutMakerCardProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
  }

  const WorkoutMakerCard: React.FC<WorkoutMakerCardProps> = ({ value, onChange, placeholder }) => {
    const [loading, setLoading] = useState(false);
    const [workoutGenerated, setWorkoutGenerated] = useState<
    {
      title?: string;
      exercises?: {name: string, sets_reps: string}[];
      rest?: string;
      safety?: string[];
      prompt?: string;
      time?: string;
      calories_burned?: string;
      id?: string;
    } | null>(null);
    const [workoutGeneratedSaved, setWorkoutGeneratedSaved] = useState(false)
    const [error, setError] = useState<string | null>(null);
    const [ai, setAI] = useState<string>('ChatGPT');
    // IN PRODUCTION, SET ENV VARIABLE NEXT_PUBLIC_API_URL IN VERCEL
    const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

    const { user } = useAuth();

    const [saveLoading, setSaveLoading] = useState(false);

    // On componnent mount, load workout from local storage if available
    useEffect(() => {
      const workoutFromStorage = localStorage.getItem("workoutGenerated");
      if (workoutFromStorage) {
        setWorkoutGenerated(JSON.parse(workoutFromStorage));
      }
    }, []);

    // Listen to a single workout document and track if it's saved
    useEffect(() => {
      if (!user || !workoutGenerated?.id) return;

      setSaveLoading(true);
      const userWorkoutsRef = collection(db, "users", user.uid, "workouts");
      const workoutDocRef = doc(userWorkoutsRef, workoutGenerated.id);

      const unsubscribe = onSnapshot(workoutDocRef, (workoutSnap) => {
        if (workoutSnap.exists()) {
          setWorkoutGeneratedSaved(true);
        } else {
          setWorkoutGeneratedSaved(false);
        }
        setSaveLoading(false);
      });
      // Clean up listener on unmount or
      // Clean up & restart listener when dependency change (new workout id)
      return () => unsubscribe();
    }, [user, workoutGenerated?.id]);

    const saveWorkout = async () => {
      if (!user || !workoutGenerated) return;
      setSaveLoading(true)
      try {
        const userWorkoutsRef = collection(db, 'users', user.uid, 'workouts');
        const docRef = await addDoc(userWorkoutsRef, workoutGenerated);
        setWorkoutGenerated({
          ...workoutGenerated,
          id: docRef.id
        })
        localStorage.setItem(
          "workoutGenerated",
          JSON.stringify({ ...workoutGenerated, id: docRef.id })
        );
        setWorkoutGeneratedSaved(true);
      } catch (err) {
        console.error('Error saving workout:', err);
        setError('Failed to save workout to your profile.');
      } finally {
        setSaveLoading(false)
      }
    };

    const handleSubmit = async () => {
      if (!value.trim()) return;
      setLoading(true);
      setWorkoutGenerated(null);
      localStorage.removeItem("workoutGenerated");
      setError(null);
      setWorkoutGeneratedSaved(false);
      try {
        const { getAuth } = await import('firebase/auth');
        const auth = getAuth();
        const currentUser = auth.currentUser;
        const idToken = currentUser ? await currentUser.getIdToken() : null;

        const response = await fetch(`${BASE_URL}/ai/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {}),
          },
          body: JSON.stringify({
            prompt: value,
            type: "workout"
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate workout plan');
        }
        const data = await response.json();
        const workoutData = {
          ...data.content,
          prompt: value
        };
        setWorkoutGenerated(workoutData);
        localStorage.setItem("workoutGenerated", JSON.stringify(workoutData));
      } catch (err: any) {
        setError('Failed to generate workout plan. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    };

    const clear = () => {
      setWorkoutGenerated(null);
      localStorage.removeItem("workoutGenerated");
      setWorkoutGeneratedSaved(false);
    }

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" component="h2" color="primary.main" gutterBottom fontWeight={600}>
            AI Workout Generator
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={2}
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || "What type of workout are you looking for? Include any equipment or time constraints."}
            disabled={loading}
          />
          
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={loading || !value.trim()}
            >
              Generate Workout
            </Button>
            {loading && <CircularProgress size={24} sx={{ ml: 2 }} />}
            <Select value={ai} onChange={(e) => setAI(e.target.value)} size='small' variant='standard' sx={{ml:2}}>
              <MenuItem value="ChatGPT">ChatGPT</MenuItem>
            </Select>
            {workoutGenerated && 
            <Button
            variant="contained"
            onClick={clear}
            sx={{ ml: 'auto' }}>
              Clear Workout
            </Button>}
          </Box>

          {/* WORKOUT */}
          {workoutGenerated && (
            <Paper elevation={2} sx={{ mt: 3, p: 3, bgcolor: 'background.paper' }}>

              <Typography variant="h5" color="primary.light" sx={{fontWeight:"bold"}} gutterBottom>
                {workoutGenerated.title || 'Your Workout Plan'}
              </Typography>
              
              <Box sx={{ mb: 1}}>
                <Typography variant="subtitle1" color="text.secondary" sx={{fontWeight:"bold"}} >
                  Exercises:
                </Typography>
                {/* decimal style type is number, disc is normal bullet pt */}
                <List sx={{ listStyleType: 'decimal', pl: 2, pt:0 }}>
                  {Array.isArray(workoutGenerated.exercises) && workoutGenerated.exercises.length>0 ? (
                    workoutGenerated.exercises.map((exercise, index) => (
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
                  {workoutGenerated.rest || "No rest period provided"}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle1" color="text.secondary" sx={{fontWeight:"bold"}}>
                  Estimated Time:
                </Typography>
                <Typography paragraph sx={{ pl: 0.2 }}>
                  {workoutGenerated.time || "No estimated time provided"}
                </Typography>
              </Box>
            
              <Box>
                <Typography variant="subtitle1" color="text.secondary" sx={{fontWeight:"bold"}}>
                  Calories Burned:
                </Typography>
                <Typography paragraph sx={{ pl: 0.2 }}>
                  {workoutGenerated.calories_burned || "No calories burned provided"}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle1" color="text.secondary" sx={{fontWeight:"bold"}}>
                  Safety Tips:
                </Typography>
                <List sx={{ listStyleType: 'decimal', pl: 2, pt:0 }}>
                  {Array.isArray(workoutGenerated.safety) && workoutGenerated.safety.length>0 ? (
                    workoutGenerated.safety.map((tip, index) => (
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

              <Box display={"flex"} justifyContent="flex-end">
                <Button 
                  variant='contained'
                  size='large'
                  disabled={workoutGeneratedSaved || saveLoading}
                  // Without ()=>, u r telling react to run function now, and assign 
                  // return value to onclick, which is not what we want
                  onClick={saveWorkout}>
                  {workoutGeneratedSaved ? "Saved" : "Save"}
                </Button>
              </Box>

            </Paper>
          )}
          {error && (
            <Box sx={{ mt: 2 }}>
              <Paper elevation={2} sx={{ p: 2, bgcolor: '#fdeded' }}>
                <Typography color="error">{error}</Typography>
              </Paper>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  export default WorkoutMakerCard;
