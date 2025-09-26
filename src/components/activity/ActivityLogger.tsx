import React, { useEffect, useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Divider,
  Alert,
  Snackbar
} from '@mui/material';
import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface SavedWorkout {
  id: string;
  title: string;
  time: string;
  calories_burned: string;
  exercises: { name: string; sets_reps: string }[];
}

interface CustomActivity {
  title: string;
  time: string;
  calories_burned: string;
  details: string;
}

export default function ActivityLogger() {
  const { user } = useAuth();
  const [savedWorkouts, setSavedWorkouts] = useState<SavedWorkout[]>([]);
  // Save selected saved workout as ID and match to savedWorkouts to get details
  const [selectedWorkoutID, setSelectedWorkoutID] = useState<string>('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Custom activity state
  const [customActivity, setCustomActivity] = useState<CustomActivity>({
    title: '',
    time: '',
    calories_burned: '',
    details: ''
  });

  const [textFieldDisabled, setTextFieldDisabled] = useState(false);
  const [date, setDate] = useState<string>('');
  const [submitError, setSubmitError] = useState(false)

  const [loading, setLoading] = useState(false)

  // Fetch saved workouts
  useEffect(() => {
    if (!user) return;

    const userWorkoutsRef = collection(db, 'users', user.uid, 'workouts');
    const q = query(userWorkoutsRef, orderBy('title', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedWorkouts: SavedWorkout[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedWorkouts.push({
          id: doc.id,
          title: data.title,
          exercises: data.exercises,
          time: data.time,
          calories_burned: data.calories_burned,
        });
      });
      setSavedWorkouts(fetchedWorkouts);
    });

    return () => unsubscribe();
  }, [user]);

  // whenever selectedWorkoutID changes, reset customactivity fields and disable them
  useEffect(() => {
    if (selectedWorkoutID) {
      setCustomActivity({
        title: '',
        time: '',
        calories_burned: '',
        details: ''
      });
      setTextFieldDisabled(true);
    }
    // WHen selectedWorkoutID = '', enable custom activity fields again
    else {setTextFieldDisabled(false)}
  }, [selectedWorkoutID]);

  const handleCustomActivityChange = (field: keyof CustomActivity) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCustomActivity((prev) => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const saveActivity = async () => {
    if (!user) return;
    try {
      setLoading(true)
      setSubmitError(false)
      const selectedDate = new Date(date);
      const now = new Date();

      // Prevent saving if the date is in the future
      if (selectedDate > now) {
        setSubmitError(true)
        setSnackbarMessage("Cannot save activity in the future!");
        setOpenSnackbar(true);
        return; // exit early
      }

      const activitiesRef = collection(db, 'users', user.uid, 'activities');
      if (selectedWorkoutID) {
        const workout = savedWorkouts.find(w => w.id === selectedWorkoutID);
        if (!workout) return;
        await addDoc(activitiesRef, {
            title: workout.title,
            details: workout.exercises,
            time: workout.time,
            calories_burned: workout.calories_burned,
            date_time: selectedDate
        });
        setSelectedWorkoutID('');
        setDate('');
        setSnackbarMessage(`Saved workout activity logged successfully on ${format(selectedDate, "MMM d, yyyy h:mm a")}!`);
        setOpenSnackbar(true);}
      else {
        if (parseInt(customActivity.time,10)<0 || parseInt(customActivity.calories_burned,10)<0){
          setSubmitError(true)
          setSnackbarMessage("Invalid entries!")
          setOpenSnackbar(true)
          return;
        }
        await addDoc(activitiesRef, {
            title: customActivity.title,
            time: customActivity.time + " minutes",
            calories_burned: customActivity.calories_burned + " kcal",
            details: customActivity.details,
            date_time: selectedDate,
        });
        setCustomActivity({
            title: '',
            time: '',
            calories_burned: '',
            details: ''
        });
        setDate('');
        setSnackbarMessage(`Custom activity logged successfully on ${format(selectedDate, "MMM d, yyyy h:mm a")}!`);
        setOpenSnackbar(true);
      };
    } catch (error) {
      console.error('Error saving activity:', error);
      setSnackbarMessage('Failed to save activity');
      setOpenSnackbar(true);
      return;
    } finally{
      setLoading(false)
    }}

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };


  //DOESNT STRETCH TO FIT PAGE, WILL TAKE UP SPACE IT NEEDS
  return (
    <Card sx={{height:'100%', overflowY: 'auto', scrollbarWidth: 'thin'}}>
      <CardContent sx={{ display:'flex', flexDirection:'column'}}>
        <Typography variant="h6" component="h2" color="primary.main" gutterBottom fontWeight={600}
        sx={{mb:1,}}>
          Activity Logger
        </Typography>

        {/* Custom Activity Section */}
        <Box>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom fontWeight={600}
          sx={{mb:1.7}}>
            Log Custom Activity
          </Typography>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Activity Title"
              value={customActivity.title}
              onChange={handleCustomActivityChange('title')}
              size="small"
              disabled={textFieldDisabled}
            />
            <TextField
              fullWidth
              label="Time (minutes)"
              value={customActivity.time} 
              onChange={handleCustomActivityChange('time')}
              type="number"
              size="small"
              slotProps={{ htmlInput: { min: 0 } }}
              disabled={textFieldDisabled}
              onKeyDown={(e) => {
                if (['e', 'E', '+', '-'].includes(e.key)) {
                e.preventDefault();
                }
              }}
            />
            <TextField
              fullWidth
              label="Calories Burned (kcal)"
              value={customActivity.calories_burned}
              onChange={handleCustomActivityChange('calories_burned')}
              type="number"
              size="small"
              slotProps={{ htmlInput: { min: 0 } }}
              disabled={textFieldDisabled}
              onKeyDown={(e) => {
                if (['e', 'E', '+', '-'].includes(e.key)) {
                e.preventDefault();
                }
              }}
            />
            <TextField
              fullWidth
              label="Details"
              value={customActivity.details}
              onChange={handleCustomActivityChange('details')}
              multiline
              rows={3}
              size="small"
              disabled={textFieldDisabled}
            />
            </Stack>

            <Typography variant="subtitle1" color="text.secondary" fontWeight={600}
            sx={{mt:1.5, mb:1.7}}>
            Log Saved Workout
            </Typography>

            <FormControl fullWidth size="small">
              <InputLabel id="workout-label">Select Workout</InputLabel>
              <Select
                value={selectedWorkoutID || ''}
                onChange={(e) => setSelectedWorkoutID(e.target.value)}
                labelId="workout-label"
                label="Select Workout"
              >
                {/* reset selection */}
                <MenuItem value="">
                  <em>~ Select Workout ~</em>
                </MenuItem>
                {/* saved workouts selection */}
                {savedWorkouts.map((workout) => (
                  <MenuItem key={workout.id} value={workout.id}>
                    {workout.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Divider sx={{mt:2, mb:3, borderBottomWidth:1.5}} />

            <TextField
              fullWidth
              label="Date & Time"
              type="datetime-local"
              value={date || ''}
              onChange={(e)=>setDate(e.target.value)}
              size="small"
              //InputLabelProps={{ shrink: true }}
              slotProps={{ inputLabel: {shrink: true} }}
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              fullWidth
              onClick={saveActivity}
              disabled={
              !((selectedWorkoutID && date) || 
              (customActivity.title && customActivity.time && customActivity.calories_burned && customActivity.details && date)
              ) || loading}
            >
              Save Activity
            </Button>
        </Box>
        <Snackbar
          open={openSnackbar}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          {submitError ? ( 
            <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
              {snackbarMessage}
            </Alert>
          ) : (
            <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
              {snackbarMessage}
            </Alert>
          )}
        </Snackbar>
      </CardContent>
    </Card>
  );
}
