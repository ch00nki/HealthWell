import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  LinearProgress,
  Button,
  Collapse,
  List,
  ListItem,
  Paper,
  Stack,
  useTheme,
  CircularProgress
} from '@mui/material';
import { BarChart } from '@mui/x-charts';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { startOfWeek, endOfWeek, isWithinInterval, format, eachDayOfInterval, isSameDay } from 'date-fns';

interface Activity {
  id: string;
  title: string;
  time: string;
  calories_burned: string;
  details: string | { name: string; sets_reps: string }[];
  date_time: Timestamp;
}

export default function ActivityProgress() {
  const { user } = useAuth();
  const [target, setTarget] = useState(0);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showActivities, setShowActivities] = useState(false);
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  const [weeklyProgress, setWeeklyProgress] = useState<number>(0);
  const [weeklyActivities, setWeeklyActivities] = useState<Activity[]>([]);
  const [nonWeeklyActivities, setNonWeeklyActivities]=useState<Activity[]>([])
  const [dailyData, setDailyData] = useState<{
    day: string;
    date: Date;
    activities: Activity[];
    totalMinutes: number;
    totalCalories: number;
  }[]>([]);
  const theme = useTheme();
  // Only shows for longer lists, bcos loading finishes even on short/empty lists when
  // unsubscribe havent fetch yet, and u dont want to load every listener fetch
  // loading only takes longer for longer lists
  const [loading, setLoading] = useState(true)

  // Fetch target and activities
  useEffect(() => {
    if (!user) return;

    // Listen for user's activity target
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeTarget = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        setTarget(doc.data().activityTarget || 0);
      }
    });

    // Listen for activities
    const activitiesRef = collection(db, 'users', user.uid, 'activities');
    const q = query(activitiesRef, orderBy('date_time', 'asc'));
    const unsubscribeActivities = onSnapshot(q, (snapshot) => {
      const fetchedActivities: Activity[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedActivities.push({
          id: doc.id,
          title: data.title,
          time: data.time,
          calories_burned: data.calories_burned,
          details: data.details,
          date_time: data.date_time,
        });
      });
      setActivities(fetchedActivities);
      setLoading(false)
      console.log("Fetched activities:", fetchedActivities);
    });

    return () => {
      unsubscribeTarget();
      unsubscribeActivities();
    };
  }, [user]);

  // SET DAILY DATA, WEEKLY ACTIVITIES & PROGRESS BAR
  useEffect(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, {weekStartsOn: 1}); // Week starts on Monday
    const weekEnd = endOfWeek(now, {weekStartsOn: 1});
    const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const weeklyActivities = activities.filter(activity => {
      const activityDate = activity.date_time ? activity.date_time.toDate() : null;
      return activityDate && isWithinInterval(activityDate, { start: weekStart, end: weekEnd });
    }).sort((a, b) => b.date_time.toDate().getTime() - a.date_time.toDate().getTime());

    const nonWeeklyActivities = activities.filter(activity => {
      const activityDate = activity.date_time ? activity.date_time.toDate() : null;
      return activityDate && !isWithinInterval(activityDate, { start: weekStart, end: weekEnd });
    }).sort((a, b) => b.date_time.toDate().getTime() - a.date_time.toDate().getTime());

    // Initialize daily data
      const initialDailyData = daysOfWeek.map(date => ({
        day: format(date, 'EEE'),
        date,
        activities: [],
        totalMinutes: 0,
        totalCalories: 0
      }));

    // Sort each days' activities & process all the data
    const processedDailyData = initialDailyData.map(dailyData => {
      // Pull activities of particular day (daily activities)
      const dailyActivities = weeklyActivities.filter(activity => {
        if (!activity.date_time) return false;
        return isSameDay(activity.date_time.toDate(), dailyData.date)
      });
      return {
        ...dailyData,
        activities: dailyActivities,
        // Total minutes/calories of that day
        // Letters and Spaces are IGNORED...
        totalMinutes: dailyActivities.reduce((sum, activity) => sum + parseInt(activity.time,10), 0),
        totalCalories: dailyActivities.reduce((sum, activity) => sum + parseInt(activity.calories_burned,10), 0)
      };
    });

    setDailyData(processedDailyData);
    setWeeklyActivities(weeklyActivities);
    setNonWeeklyActivities(nonWeeklyActivities)

    // Calculate total progress for progress bar
    const totalMinutes = processedDailyData.reduce((sum, day) => sum + day.totalMinutes, 0);
    setWeeklyProgress(totalMinutes / 60); // Convert minutes to hours
  }, [activities]);


  // update the target activity level
  const updateTarget = async (increment: boolean) => {
    if (!user) return;
    const newTarget = increment ? target + 1 : Math.max(0, target - 1);
    
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        activityTarget: newTarget
      });
    } catch (error) {
      console.error('Error updating target:', error);
    }
  };

  // Used ltr to format activities display
  const formatActivityDetails = (activity: Activity) => {
    if (Array.isArray(activity.details)) {
      return (
        <List dense sx={{ listStyleType: 'disc', pl: 3 , py: 0 }}>
          {(activity.details as { name: string; sets_reps: string }[]).map((exercise, index) => (
            <ListItem key={index} sx={{ display: 'list-item' , pl:0}}>
              <Typography variant="body2">
                {exercise.name} — {exercise.sets_reps}
              </Typography>
            </ListItem>
          ))}
        </List>
      );
    }
    return <Typography variant="body2" color="text.primary">{activity.details}</Typography>;
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
    <Card sx={{maxHeight:1000, overflowY: 'auto', scrollbarWidth:'thin'}}>
      <CardContent>
        <Typography variant="h6" component="h2" color="primary.main" gutterBottom fontWeight={600}>
          Weekly Activity Progress
        </Typography>

        {/* Target Setting */}
        <Box display="flex" alignItems="center" mb={3}>
          <Typography variant="subtitle1" sx={{ mr: 2 }}>
            Weekly Target:
          </Typography>
          <IconButton onClick={() => updateTarget(false)} size="small">
            <RemoveIcon />
          </IconButton>
          <Typography sx={{ mx: 2 }}>{target} hours</Typography>
          <IconButton onClick={() => updateTarget(true)} size="small">
            <AddIcon />
          </IconButton>
        </Box>

        {/* Progress Bar */}
        <Box mb={3}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Progress: {weeklyProgress.toFixed(1)} / {target} hours
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {target > 0 ? `${Math.min(100, (weeklyProgress / target) * 100).toFixed(1)}%` : '0.0%'}
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={target > 0 ? Math.min(100, (weeklyProgress / target) * 100) : 0}
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Box>

        {/* Activity Chart */}
        <Box mb={1} height={250} display={'flex'} flexDirection={'column'} alignItems={'flex-start'}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Daily Activity Minutes
          </Typography>
          <BarChart display={'flex'}
            xAxis={[{
              scaleType: 'band',
              data: dailyData.map(day => day.day),
            }]}
            series={[{
              data: dailyData.map(day => day.totalMinutes),
              color: theme.palette.primary.main,
              valueFormatter: (value) => `${value} minutes`,
            }]}
            width={460}
            margin={{ left: 20, right: 10}}
          />
          </Box>      

        {/* Activities List */}
        <Box>
          <Button
            onClick={() => setShowActivities(!showActivities)}
            endIcon={showActivities ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{ mb: 1 }}
            size="large"
          >
            View History
          </Button>

          <Collapse in={showActivities}>
            {(weeklyActivities?.length === 0 && nonWeeklyActivities?.length === 0) ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ ml: 2, mt: -0.5, mb: 0.5 }}
              >
                No activities recorded yet
              </Typography>
            ) : (
              <>
                {/* Weekly Activities */}
                {weeklyActivities?.length > 0 && (
                  <>
                    <Typography
                      variant="overline"
                      color="text.secondary"
                      sx={{ fontWeight: "bold", ml: 1, fontSize: 17, lineHeight: 0, display: "block", mt: 2, mb: 2 }}
                    >
                      This Week
                    </Typography>
                    <Stack spacing={1}>
                      {weeklyActivities.map((activity) => (
                        <Paper key={activity.id} elevation={1} sx={{ p: 2 }}>
                          <Box
                            onClick={() =>
                              setExpandedActivity(expandedActivity === activity.id ? null : activity.id)
                            }
                            sx={{ cursor: "pointer" }}
                          >
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="subtitle1">
                                {activity.title} • ({format(activity.date_time.toDate(), "EEE")})
                              </Typography>
                              {expandedActivity === activity.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </Box>
                            <Collapse in={expandedActivity === activity.id}>
                              <Box mt={2}>
                                <Box display="flex" gap={1} sx={{ mb: 0.3 }}>
                                  <Typography variant="body2" color="text.secondary">Date:</Typography>
                                  <Typography variant="body2" color="text.primary">
                                    {format(activity.date_time.toDate(), "MMM d, yyyy h:mm a")}
                                  </Typography>
                                </Box>

                                <Box display="flex" gap={1} sx={{ mb: 0.3 }}>
                                  <Typography variant="body2" color="text.secondary">Time:</Typography>
                                  <Typography variant="body2" color="text.primary">
                                    {activity.time}
                                  </Typography>
                                </Box>

                                <Box display="flex" gap={1} sx={{ mb: 0.3 }}>
                                  <Typography variant="body2" color="text.secondary">Calories burned:</Typography>
                                  <Typography variant="body2" color="text.primary">
                                    {activity.calories_burned}
                                  </Typography>
                                </Box>

                                {Array.isArray(activity.details) ? (
                                  <Box>
                                    <Typography variant="body2" color="text.secondary">Details:</Typography>
                                    {formatActivityDetails(activity)}
                                  </Box>
                                ) : (
                                  <Box display="flex" gap={1}>
                                    <Typography variant="body2" color="text.secondary">Details:</Typography>
                                    {formatActivityDetails(activity)}
                                  </Box>
                                )}
                              </Box>
                            </Collapse>
                          </Box>
                        </Paper>
                      ))}
                    </Stack>
                  </>
                )}

                {/* Non-Weekly Activities */}
                {nonWeeklyActivities?.length > 0 && (
                  <>
                    <Typography
                      variant="overline"
                      color="text.secondary"
                      sx={{ fontWeight: "bold", ml: 1, fontSize: 17, lineHeight: 0, display: "block", mt: 4, mb: 2 }}
                    >
                      Before
                    </Typography>
                    <Stack spacing={1}>
                      {nonWeeklyActivities.map((activity) => (
                        <Paper key={activity.id} elevation={1} sx={{ p: 2 }}>
                          <Box
                            onClick={() =>
                              setExpandedActivity(expandedActivity === activity.id ? null : activity.id)
                            }
                            sx={{ cursor: "pointer" }}
                          >
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="subtitle1">
                                {activity.title} • ({format(activity.date_time.toDate(), "d/M/yyyy")})
                              </Typography>
                              {expandedActivity === activity.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </Box>
                            <Collapse in={expandedActivity === activity.id}>
                              <Box mt={2}>
                                <Box display="flex" gap={1} sx={{ mb: 0.3 }}>
                                  <Typography variant="body2" color="text.secondary">Date:</Typography>
                                  <Typography variant="body2" color="text.primary">
                                    {format(activity.date_time.toDate(), "MMM d, yyyy h:mm a")}
                                  </Typography>
                                </Box>

                                <Box display="flex" gap={1} sx={{ mb: 0.3 }}>
                                  <Typography variant="body2" color="text.secondary">Time:</Typography>
                                  <Typography variant="body2" color="text.primary">
                                    {activity.time}
                                  </Typography>
                                </Box>

                                <Box display="flex" gap={1} sx={{ mb: 0.3 }}>
                                  <Typography variant="body2" color="text.secondary">Calories burned:</Typography>
                                  <Typography variant="body2" color="text.primary">
                                    {activity.calories_burned}
                                  </Typography>
                                </Box>

                                {Array.isArray(activity.details) ? (
                                  <Box>
                                    <Typography variant="body2" color="text.secondary">Details:</Typography>
                                    {formatActivityDetails(activity)}
                                  </Box>
                                ) : (
                                  <Box display="flex" gap={1}>
                                    <Typography variant="body2" color="text.secondary">Details:</Typography>
                                    {formatActivityDetails(activity)}
                                  </Box>
                                )}
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
