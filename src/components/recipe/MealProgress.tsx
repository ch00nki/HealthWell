import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box, LinearProgress, Button, Collapse, Paper, Stack, TextField, CircularProgress } from '@mui/material';
// removed unused imports
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { startOfWeek, endOfWeek, isWithinInterval, format, isSameDay } from 'date-fns';

interface Meal{
    id: string;
    title: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    date_time: Timestamp;
}

export default function MealProgress(){
  const { user } = useAuth();
  const [target, setTarget] = useState<number>(0); // String when empty ""
  const [meals, setMeals] = useState<Meal[]>([])
  const [todaysMeals, setTodaysMeals] = useState<Meal[]>([])
  const [weeklyMeals, setWeeklyMeals] = useState<Meal[]>([])
  const [nonWeeklyMeals, setNonWeeklyMeals] = useState<Meal[]>([])
  const [showMeals, setShowMeals] = useState(false);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [todaysProgress, setTodaysProgress] = useState<number>(0)
  // Only shows for longer lists, bcos loading finishes even on short/empty lists when
  // unsubscribe havent fetch yet, and u dont want to load every listener fetch
  // loading only takes longer for longer lists
  const [loading, setLoading] = useState(true)
  
  // Fetch target and meals
  useEffect(() => {
    if (!user) return;
    // Listen for user's calorie target
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeTarget = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        setTarget(doc.data().targetCalories || 0);
      }
    });
    // Listen for meals
    const mealsRef = collection(db, 'users', user.uid, 'meals');
    const q = query(mealsRef, orderBy('date_time', 'asc'));
    const unsubscribeMeals = onSnapshot(q, (snapshot) => {
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
      setLoading(false)
      console.log("Fetched meals:", fetchedMeals);
    });

    return () => {
      unsubscribeTarget();
      unsubscribeMeals();
    };
  }, [user]);

  useEffect(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, {weekStartsOn: 1}); // Week starts on Monday
    const weekEnd = endOfWeek(now, {weekStartsOn: 1});

    const todayMeals: Meal[] = [];
    const weeklyMeals: Meal[] = [];
    const nonWeeklyMeals: Meal[] = [];

    meals.forEach(meal => {
        const mealDate = meal.date_time?.toDate();
        if (!mealDate) return;

        if (isSameDay(mealDate, now)){
        todayMeals.push(meal)
        } else if (isWithinInterval(mealDate, {start: weekStart, end: weekEnd})){
        weeklyMeals.push(meal)
        } else {
        nonWeeklyMeals.push(meal)
        }
    })
    todayMeals.sort((a, b) => b.date_time.toDate().getTime() - a.date_time.toDate().getTime());
    weeklyMeals.sort((a, b) => b.date_time.toDate().getTime() - a.date_time.toDate().getTime());
    nonWeeklyMeals.sort((a, b) => b.date_time.toDate().getTime() - a.date_time.toDate().getTime());

    setTodaysMeals(todayMeals)
    setWeeklyMeals(weeklyMeals)
    setNonWeeklyMeals(nonWeeklyMeals)
    const totalCalories = todayMeals.reduce((sum, meal) => sum + meal.calories, 0)
    setTodaysProgress(totalCalories)

  }, [meals])
    //   const todayMeals = meals.filter(meal => {
    //     const mealDate = meal.date_time ? meal.date_time.toDate() : null;
    //     return mealDate && isSameDay(mealDate, now);
    //   }).sort((a, b) => b.date_time.toDate().getTime() - a.date_time.toDate().getTime());
    //   setTodaysMeals(todayMeals)

    //   const weeklyMeals = meals.filter(meal => {
    //     const mealDate = meal.date_time ? meal.date_time.toDate() : null;
    //     return mealDate && isWithinInterval(mealDate, { start: weekStart, end: weekEnd });
    //   }).sort((a, b) => b.date_time.toDate().getTime() - a.date_time.toDate().getTime());
    //   setWeeklyMeals(weeklyMeals)

    //   const nonWeeklyMeals = meals.filter(meal => {
    //     const mealDate = meal.date_time ? meal.date_time.toDate() : null;
    //     return mealDate && !isWithinInterval(mealDate, { start: weekStart, end: weekEnd });
    //   }).sort((a, b) => b.date_time.toDate().getTime() - a.date_time.toDate().getTime());
    //   setNonWeeklyMeals(nonWeeklyMeals)
  // update the target activity level
  const updateTarget = async (value: number) => {
    if (!user) return;    
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        targetCalories: value
      });
    } catch (error) {
      console.error('Error updating target:', error);
    }
  };
  if (loading) {
    return (
        <Card>
        <CardContent>
            <Box display="flex" justifyContent="center" alignItems="center" height={250}>
            <CircularProgress />
            </Box>
        </CardContent>
        </Card>
    );
  }

  return (
    <Card sx={{maxHeight:1000, overflowY:'auto', scrollbarWidth:'thin'}}>
      <CardContent>
        <Typography variant="h6" component="h2" color="primary.main" gutterBottom fontWeight={600}>
          {"Today's Meal Progress"}
        </Typography>

        {/* Target Setting */}
        <Box display="flex" alignItems="center" mb={3}>
          <Typography variant="subtitle1" sx={{ mr: 2 }}>
            Daily Calorie Target:
          </Typography>
          <TextField
                type="number"
                size="small"
                value={target || "No target yet"}
                onChange={(e) => {
                // Makes sure number NEVER goes below zero, instead of htmlInput min:0
                // makes value number when valid, "" when empty
                const value = e.target.value === "No target yet" ? 0 : Math.max(0, Number(e.target.value));
                updateTarget(value);
                }}
                onKeyDown={(e) => {
                if (["e", "E", "+", "-"].includes(e.key)) {
                    e.preventDefault();
                }
                }}
                inputProps={{ min: 0 }}
                sx={{ width: 120 }}
            />
            <Typography sx={{ ml: 1.5 }}>kcal</Typography>
        </Box>

        {/* Progress Bar */}
        <Box mb={3}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Progress: {todaysProgress.toFixed(1)} / {target} kcal
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {target > 0 ? `${Math.min(100, (todaysProgress / target) * 100).toFixed(1)}%` : '0.0%'}
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={target > 0 ? Math.min(100, (todaysProgress / target) * 100) : 0}
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Box>

        {/* Today's Meals  */}
        <Box sx={{mb:2}}>
          <Typography variant='overline' color='text.secondary' sx={{fontWeight:'bold', ml:1, fontSize:17, lineHeight:0, display:'block', mt:4.5, mb:2}}>
            Today
          </Typography>
          {todaysMeals && todaysMeals.length==0? (
            <Typography variant='body2' color='text.secondary' sx={{ml:2, mt:2.5, mb:0.5}}>Empty for now...</Typography>
          ) : (
            <Stack spacing={1}>
              {todaysMeals.map((meal) => (
                  <Paper key={meal.id} elevation={1} sx={{ p: 2 }}>
                    <Box
                      onClick={() => setExpandedMeal(expandedMeal === meal.id ? null : meal.id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle1">{meal.title} • ({format(meal.date_time.toDate(), 'EEE')})</Typography>
                        {expandedMeal === meal.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </Box>
                      <Collapse in={expandedMeal === meal.id}>
                        <Box mt={2}>
                          <Box display="flex" gap={1} sx={{mb:0.3}}>
                            <Typography variant="body2" color="text.secondary">Date:</Typography>
                            <Typography variant="body2" color="text.primary">
                                {format(meal.date_time.toDate(), 'MMM d, yyyy h:mm a')}
                            </Typography>
                            </Box>

                            <Box display="flex" gap={1} sx={{mb:0.3}}>
                            <Typography variant="body2" color="text.secondary">Calories:</Typography>
                            <Typography variant="body2" color="text.primary">
                                {meal.calories}
                            </Typography>
                            </Box>

                            <Box display="flex" gap={1} sx={{mb:0.3}}>
                            <Typography variant="body2" color="text.secondary">Protein:</Typography>
                            <Typography variant="body2" color="text.primary">
                                {meal.protein}
                            </Typography>
                            </Box>

                            <Box display="flex" gap={1} sx={{mb:0.3}}>
                            <Typography variant="body2" color="text.secondary">Carbs:</Typography>
                            <Typography variant="body2" color="text.primary">
                                {meal.carbs}
                            </Typography>
                            </Box>

                            <Box display="flex" gap={1} sx={{mb:0.3}}>
                            <Typography variant="body2" color="text.secondary">Fats:</Typography>
                            <Typography variant="body2" color="text.primary">
                                {meal.fats}
                            </Typography>
                            </Box>
                        </Box>
                      </Collapse>
                    </Box>
                  </Paper>
                ))}
            </Stack>
          )}
          
        </Box>

        {/* Meals List */}
        <Box>
        <Button
            onClick={() => setShowMeals(!showMeals)}
            endIcon={showMeals ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{ mb: 1 }}
            size="large"
        >
            View History
        </Button>

        <Collapse in={showMeals}>
            {/* Check if both are empty */}
            {(weeklyMeals?.length === 0 && nonWeeklyMeals?.length === 0) ? (
            <Typography
                variant="body2"
                color="text.secondary"
                sx={{ ml: 2, mt: -0.5, mb: 0.5 }}
            >
                No meals recorded before today
            </Typography>
            ) : (
            <>
                {/* Show Weekly Meals if not empty */}
                {weeklyMeals?.length > 0 && (
                <>
                    <Typography
                    variant="overline"
                    color="text.secondary"
                    sx={{ fontWeight: "bold", ml: 1, fontSize: 17, lineHeight: 0, display: "block", mt: 2, mb: 2 }}
                    >
                    This Week
                    </Typography>
                    <Stack spacing={1}>
                    {weeklyMeals.map((meal) => (
                        <Paper key={meal.id} elevation={1} sx={{ p: 2 }}>
                        <Box
                            onClick={() =>
                            setExpandedMeal(expandedMeal === meal.id ? null : meal.id)
                            }
                            sx={{ cursor: "pointer" }}
                        >
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle1">
                                {meal.title} • ({format(meal.date_time.toDate(), "EEE")})
                            </Typography>
                            {expandedMeal === meal.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </Box>
                            
                            <Collapse in={expandedMeal === meal.id}>
                            <Box mt={2}>
                                <Box display="flex" gap={1} sx={{ mb: 0.3 }}>
                                <Typography variant="body2" color="text.secondary">Date:</Typography>
                                <Typography variant="body2" color="text.primary">
                                    {format(meal.date_time.toDate(), "MMM d, yyyy h:mm a")}
                                </Typography>
                                </Box>

                                <Box display="flex" gap={1} sx={{ mb: 0.3 }}>
                                <Typography variant="body2" color="text.secondary">Calories:</Typography>
                                <Typography variant="body2" color="text.primary">
                                    {meal.calories}
                                </Typography>
                                </Box>

                                <Box display="flex" gap={1} sx={{ mb: 0.3 }}>
                                <Typography variant="body2" color="text.secondary">Protein:</Typography>
                                <Typography variant="body2" color="text.primary">
                                    {meal.protein}
                                </Typography>
                                </Box>

                                <Box display="flex" gap={1} sx={{ mb: 0.3 }}>
                                <Typography variant="body2" color="text.secondary">Carbs:</Typography>
                                <Typography variant="body2" color="text.primary">
                                    {meal.carbs}
                                </Typography>
                                </Box>

                                <Box display="flex" gap={1} sx={{ mb: 0.3 }}>
                                <Typography variant="body2" color="text.secondary">Fats:</Typography>
                                <Typography variant="body2" color="text.primary">
                                    {meal.fats}
                                </Typography>
                                </Box>
                            </Box>
                            </Collapse>
                        </Box>
                        </Paper>
                    ))}
                    </Stack>
                </>
                )}

                {/* Show Non-Weekly Meals if not empty */}
                {nonWeeklyMeals?.length > 0 && (
                <>
                    <Typography
                    variant="overline"
                    color="text.secondary"
                    sx={{ fontWeight: "bold", ml: 1, fontSize: 17, lineHeight: 0, display: "block", mt: 4, mb: 2 }}
                    >
                    Before
                    </Typography>
                    <Stack spacing={1}>
                    {nonWeeklyMeals.map((meal) => (
                        <Paper key={meal.id} elevation={1} sx={{ p: 2 }}>
                        <Box
                            onClick={() =>
                            setExpandedMeal(expandedMeal === meal.id ? null : meal.id)
                            }
                            sx={{ cursor: "pointer" }}
                        >
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle1">
                                {meal.title} • ({format(meal.date_time.toDate(), "d/M/yyyy")})
                            </Typography>
                            {expandedMeal === meal.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </Box>
                            <Collapse in={expandedMeal === meal.id}>
                            <Box mt={2}>
                                <Box display="flex" gap={1} sx={{ mb: 0.3 }}>
                                <Typography variant="body2" color="text.secondary">Date:</Typography>
                                <Typography variant="body2" color="text.primary">
                                    {format(meal.date_time.toDate(), "MMM d, yyyy h:mm a")}
                                </Typography>
                                </Box>

                                <Box display="flex" gap={1} sx={{ mb: 0.3 }}>
                                <Typography variant="body2" color="text.secondary">Calories:</Typography>
                                <Typography variant="body2" color="text.primary">
                                    {meal.calories}
                                </Typography>
                                </Box>

                                <Box display="flex" gap={1} sx={{ mb: 0.3 }}>
                                <Typography variant="body2" color="text.secondary">Protein:</Typography>
                                <Typography variant="body2" color="text.primary">
                                    {meal.protein}
                                </Typography>
                                </Box>

                                <Box display="flex" gap={1} sx={{ mb: 0.3 }}>
                                <Typography variant="body2" color="text.secondary">Carbs:</Typography>
                                <Typography variant="body2" color="text.primary">
                                    {meal.carbs}
                                </Typography>
                                </Box>

                                <Box display="flex" gap={1} sx={{ mb: 0.3 }}>
                                <Typography variant="body2" color="text.secondary">Fats:</Typography>
                                <Typography variant="body2" color="text.primary">
                                    {meal.fats}
                                </Typography>
                                </Box>
                            </Box>
                            </Collapse>
                        </Box>
                        </Paper>
                    ))}
                    </Stack>
                </>
                )}
            </>
            )}
        </Collapse>
        </Box>

      </CardContent>
    </Card>
  );
}
