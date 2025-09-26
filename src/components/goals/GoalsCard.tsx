// 'use client';

// import React, { useState, useEffect } from 'react';
// import { useAuth } from '@/contexts/AuthContext';
// import { doc, getDoc, setDoc } from 'firebase/firestore';
// import { db } from '@/lib/firebase';
// import {
//   Box,
//   Card,
//   CardContent,
//   Typography,
//   IconButton,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   Button,
//   TextField,
//   Grid,
//   LinearProgress,
//   Tooltip,
// } from '@mui/material';
// import EditIcon from '@mui/icons-material/Edit';
// import InfoIcon from '@mui/icons-material/Info';

// // Mock data - replace with real data later
// const mockData = {
//   activityTarget: 5,
//   currentActivity: 4, // hours this week
// };

// export default function GoalsCard() {
//   const { user } = useAuth();
//   const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
//   const [goalWeight, setGoalWeight] = useState(0);
//   const [editGoalWeight, setEditGoalWeight] = useState(0);
//   const [activityTarget, setActivityTarget] = useState(mockData.activityTarget);
//   const [currentWeight, setCurrentWeight] = useState(0);
//   const [maintenanceCalories, setMaintenanceCalories] = useState(0);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchUserData = async () => {
//       if (!user) return;

//       try {
//         const docRef = doc(db, 'users', user.uid);
//         const docSnap = await getDoc(docRef);
        
//         if (docSnap.exists()) {
//           const data = docSnap.data();
//           setCurrentWeight(data.weight || 0);
//           setMaintenanceCalories(data.maintenanceCalories || 0);
//           setGoalWeight(data.goalWeight || 0);
//           setEditGoalWeight(data.goalWeight || 0);
//         }
//       } catch (error) {
//         console.error('Error fetching user data:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchUserData();
//   }, [user]);

//   const handleEditDialogOpen = () => {
//     setEditGoalWeight(goalWeight);
//     setIsEditDialogOpen(true);
//   };

//   //Update goal weight in database
//   const handleSave = async () => {
//     if (!user) return;
//     try {
//       const docRef = doc(db, 'users', user.uid);
//       await setDoc(docRef, { goalWeight: editGoalWeight }, { merge: true });
//       setGoalWeight(editGoalWeight);
//     } catch (error) {
//       console.error('Error saving goal weight:', error);
//     }
//     setIsEditDialogOpen(false);
//   };

//   const activityProgress = Math.min((mockData.currentActivity / activityTarget) * 100, 100);
  
//   return (
//     <Card sx={{ width: '100%', overflow: 'visible' }}>
//       <CardContent sx={{ p: 3 }}>
//         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
//           <Typography variant="h6" component="h2" color="primary.main" fontWeight={600}>
//             My Goals
//           </Typography>
//           <IconButton 
//             onClick={handleEditDialogOpen}
//             size="small"
//             sx={{ color: 'primary.main' }}
//           >
//             <EditIcon />
//           </IconButton>
//         </Box>

//         {/* Weight Section */}
//         <Box sx={{ 
//           display: 'flex', 
//           gap: 2, 
//           mb: 3 
//         }}>
//           <Box sx={{ 
//             flex: 1,
//             bgcolor: 'background.default', 
//             px: 2, pt:1.5, pb:1,
//             borderRadius: 1,
//             border: 1,
//             borderColor: 'divider'
//           }}>
//             <Typography variant="subtitle2" color="text.secondary" gutterBottom>
//               Current<br />Weight
//             </Typography>
//             <Typography variant="h6" color="text.primary">
//               {currentWeight || '__'} kg
//             </Typography>
//           </Box>
//           <Box sx={{ 
//             flex: 1,
//             bgcolor: 'background.default', 
//             px: 2, pt:1.5, pb:1,
//             borderRadius: 1,
//             border: 1,
//             borderColor: 'divider'
//           }}>
//             <Typography variant="subtitle2" color="text.secondary" gutterBottom>
//               Goal<br />Weight
//             </Typography>
//             <Typography variant="h6" color="text.primary">
//               {goalWeight || '__'} kg
//             </Typography>
//           </Box>
//         </Box>

//         {/* Maintenance Calories Section */}
//         <Box sx={{
//           bgcolor: 'background.default',
//           p: 2,
//           borderRadius: 1,
//           border: 1,
//           borderColor: 'divider',
//           mb: 3
//         }}>
//           <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
//             <Typography variant="subtitle2" color="text.secondary">
//               Maintenance Calories
//             </Typography>
//             <Typography color="text.primary">
//               {maintenanceCalories || '__'} kcal
//             </Typography>
//           </Box>
//           {goalWeight ? 
//             (goalWeight>currentWeight ? <Typography variant='body2' sx={{ fontWeight: 600 }}>Aim for 100-500 calorie surplus!</Typography>
//               : <Typography variant='body2' sx={{ fontWeight: 600 }}>Aim for 100-500 calorie deficit!</Typography>)
//             : ''}
//         </Box>

//         {/* Activity Progress Section */}
//         <Box sx={{ 
//           p: 2, 
//           borderRadius: 1, 
//           border: 1, 
//           borderColor: 'divider',
//           bgcolor: 'background.default',
//           mt: 2
//         }}>
//           <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
//             <Typography variant="subtitle2" color="text.secondary">
//               Weekly Activity Target
//             </Typography>
//             <Typography color="text.primary">
//                 {activityTarget} hrs
//               </Typography>
//           </Box>
//           <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//             <Typography variant="subtitle2" color="text.secondary">
//               Progress This Week
//             </Typography>
//             <Box sx={{ display: 'flex', alignItems: 'center' }}>
//               <Typography variant="body2" color="text.secondary">
//                 {mockData.currentActivity}/{activityTarget} hrs
//               </Typography>
//               <Tooltip title="Track your activities in the Activity Log">
//                 <InfoIcon sx={{ ml: 1, fontSize: 16, color: 'text.secondary' }} />
//               </Tooltip>
//             </Box>
//           </Box>
//           <LinearProgress 
//             variant="determinate" 
//             value={activityProgress} 
//             sx={{ 
//               mt: 2,
//               height: 8,
//               borderRadius: 4,
//               bgcolor: 'background.paper',
//               '& .MuiLinearProgress-bar': {
//                 borderRadius: 4,
//               }
//             }} 
//           />
//         </Box>

//         {/* Edit Dialog */}
//         <Dialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)}>
//           <DialogTitle>Edit Goals</DialogTitle>
//           <DialogContent>
//             <Box sx={{ pt: 2 }}>
//               <TextField
//                 fullWidth
//                 label="Goal Weight (kg)"
//                 type="number"
//                 value={editGoalWeight || ''}
//                 onChange={(e) => setEditGoalWeight(Number(e.target.value))}
//                 sx={{ mb: 3 }}
//                 InputProps={{ inputProps: { min: 0 } }}
//               />
//               <TextField
//                 fullWidth
//                 label="Weekly Activity Target (hours)"
//                 type="number"
//                 value={activityTarget}
//                 onChange={(e) => setActivityTarget(Number(e.target.value))}
//                 sx={{ mb: 3 }}
//                 InputProps={{ inputProps: { min: 0 } }}
//               />
//               <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
//                 • Update current weight in profile
//               </Typography>
//               <Typography variant="body2" color="text.secondary">
//                 • Update weekly activity in activity log
//               </Typography>
//             </Box>
//           </DialogContent>
//           <DialogActions>
//             <Button onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
//             <Button onClick={handleSave} variant="contained">Save</Button>
//           </DialogActions>
//         </Dialog>
//       </CardContent>
//     </Card>
//   );
// }

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  doc,
  onSnapshot,
  updateDoc,
  collection,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  LinearProgress,
  CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { startOfWeek, endOfWeek, isSameDay, isWithinInterval } from 'date-fns';

interface Meal {
  id: string;
  title: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  date_time: { toDate?: () => Date } | null;
}

interface Activity {
  id: string;
  title: string;
  time: string; 
  date_time: { toDate?: () => Date } | null;
}

export default function GoalsCard() {
  const { user } = useAuth();
  const [currentWeight, setCurrentWeight] = useState<number>(0);
  const [maintenanceCalories, setMaintenanceCalories] = useState<number>(0);
  const [targetCalories, setTargetCalories] = useState<number>(0);
  const [activityTarget, setActivityTarget] = useState<number>(0);
  const [editTargetCalories, setEditTargetCalories] = useState<number>(0);
  const [editActivityTarget, setEditActivityTarget] = useState<number>(0);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [todaysProgress, setTodaysProgress] = useState<number>(0);
  const [weeklyProgress, setWeeklyProgress] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch user data + meals + activities
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCurrentWeight(data.weight || 0);
        setMaintenanceCalories(data.maintenanceCalories || 0);
        setTargetCalories(data.targetCalories || 0);
        setActivityTarget(data.activityTarget || 0);
        setEditTargetCalories(data.targetCalories || 0);
        setEditActivityTarget(data.activityTarget || 0);
      }
    });

    const mealsRef = collection(db, 'users', user.uid, 'meals');
    const mealsQuery = query(mealsRef, orderBy('date_time', 'asc'));
    const unsubscribeMeals = onSnapshot(mealsQuery, (snapshot) => {
      const fetchedMeals: Meal[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedMeals.push({
          id: doc.id,
          title: data.title,
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fats: data.fats,
          date_time: data.date_time,
        });
      });
      setMeals(fetchedMeals);
      setLoading(false);
    });

    const activitiesRef = collection(db, 'users', user.uid, 'activities');
    const activitiesQuery = query(activitiesRef, orderBy('date_time', 'asc'));
    const unsubscribeActivities = onSnapshot(activitiesQuery, (snapshot) => {
      const fetched: Activity[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetched.push({
          id: doc.id,
          title: data.title,
          time: data.time,
          date_time: data.date_time,
        });
      });
      setActivities(fetched);
      setLoading(false);
    });

    return () => {
      unsubscribeUser();
      unsubscribeMeals();
      unsubscribeActivities();
    };
  }, [user]);

  // Calculate today's calories
  useEffect(() => {
    const now = new Date();
    const todayMeals = meals.filter((meal) =>
      meal.date_time?.toDate ? meal.date_time.toDate() && isSameDay(meal.date_time.toDate(), now) : false
    );
    const totalCalories = todayMeals.reduce((sum, meal) => sum + meal.calories, 0);
    setTodaysProgress(totalCalories);
  }, [meals]);

  // Calculate weekly activity progress
  useEffect(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const weeklyActivities = activities.filter((activity) =>
      activity.date_time?.toDate ? isWithinInterval(activity.date_time.toDate(), { start: weekStart, end: weekEnd }) : false
    );

    const totalMinutes = weeklyActivities.reduce((sum, act) => sum + parseInt(act.time, 10), 0);
    setWeeklyProgress(totalMinutes / 60); // Convert to hours
  }, [activities]);

  const handleEditDialogOpen = () => {
    setEditTargetCalories(targetCalories);
    setEditActivityTarget(activityTarget);
    setIsEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        targetCalories: editTargetCalories,
        activityTarget: editActivityTarget,
      });
      setTargetCalories(editTargetCalories);
      setActivityTarget(editActivityTarget);
    } catch (error) {
      console.error('Error updating goals:', error);
    } finally {
      setSaving(false);
      setIsEditDialogOpen(false);
    }
  };

  return (
    <Card sx={{ width: '100%', overflow: 'visible' }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header row */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" color="primary.main" fontWeight={600}>My Goals</Typography>
          <IconButton onClick={handleEditDialogOpen} size="small" sx={{ color: 'primary.main' }}>
            <EditIcon />
          </IconButton>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" py={5}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Current Weight */}
            <Box mb={2}>
              <Typography variant="body1" color="text.secondary">Current Weight</Typography>
              <Typography variant="body1" color={currentWeight ? 'text.primary' : 'error'} ml={0.2}> 
                {currentWeight ? `${currentWeight} kg` : 'Update profile'}
              </Typography>
            </Box>

            {/* Maintenance Calories */}
            <Box mb={2}>
              <Typography variant="body1" color="text.secondary">Maintenance Calories</Typography>
              <Typography variant="body1" color={maintenanceCalories ? 'text.primary' : 'error'} ml={0.2}>
                {maintenanceCalories ? `${maintenanceCalories} kcal` : 'Complete profile to calculate'}
              </Typography>
            </Box>

            {/* Daily Target Calories */}
            <Box mb={0.8}>
              <Typography variant="body1" color="text.secondary">Daily Calorie Target</Typography>
              <Typography variant="body1" ml={0.2}>{targetCalories ? `${targetCalories} kcal` : '__ kcal'}</Typography>
            </Box>

            {/* Calories Progress Bar */}
            <Box mb={3}>
              <Box display="flex" justifyContent="space-between" mb={1} ml={0.2}>
                <Typography variant="body2" color="text.secondary">
                  Progress: {todaysProgress.toFixed(1)} / {targetCalories} kcal
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {targetCalories > 0 ? `${Math.min(100, (todaysProgress / targetCalories) * 100).toFixed(1)}%` : '0.0%'}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={targetCalories > 0 ? Math.min(100, (todaysProgress / targetCalories) * 100) : 0}
                sx={{ height: 10, borderRadius: 5, ml: 0.2 }}
              />
            </Box>

            {/* Weekly Activity Target */}
            <Box mb={0.8}>
              <Typography variant="body1" color="text.secondary">Weekly Activity Target</Typography>
              <Typography variant="body1">{activityTarget ? `${activityTarget} hours` : '__ hours'}</Typography>
            </Box>

            {/* Activity Progress */}
            <Box mb={2}>
              <Box display="flex" justifyContent="space-between" mb={1} ml={0.2}>
                <Typography variant="body2" color="text.secondary">
                  Progress: {weeklyProgress.toFixed(1)} / {activityTarget} hours
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {activityTarget > 0 ? `${Math.min(100, (weeklyProgress / activityTarget) * 100).toFixed(1)}%` : '0.0%'}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={activityTarget > 0 ? Math.min(100, (weeklyProgress / activityTarget) * 100) : 0}
                sx={{ height: 10, borderRadius: 5, ml: 0.2 }}
              />
            </Box>
          </>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)}>
          <DialogTitle>Edit Goals</DialogTitle>
          <DialogContent>
            <Box pt={2}>
              <TextField
                fullWidth
                label="Daily Calories (kcal)"
                type="number"
                value={editTargetCalories || ''}
                onChange={(e) => setEditTargetCalories(Number(e.target.value))}
                sx={{ mb: 3 }}
                InputProps={{ inputProps: { min: 0 } }}
              />
              <TextField
                fullWidth
                label="Weekly Activity Target (hours)"
                type="number"
                value={editActivityTarget || ''}
                onChange={(e) => setEditActivityTarget(Number(e.target.value))}
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} variant="contained" disabled={saving}>
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}
