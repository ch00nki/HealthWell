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
import {
  collection,
  query,
  orderBy,
  doc,
  updateDoc,
  Timestamp,
  limit,
  getDocs,
  startAfter,
  DocumentData,
  QueryDocumentSnapshot,
  onSnapshot
} from 'firebase/firestore';
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
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [showActivities, setShowActivities] = useState(false);
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  const [weeklyProgress, setWeeklyProgress] = useState<number>(0);
  const [weeklyActivities, setWeeklyActivities] = useState<Activity[]>([]);
  const [nonWeeklyActivities, setNonWeeklyActivities] = useState<Activity[]>([]);
  const [dailyData, setDailyData] = useState<
    {
      day: string;
      date: Date;
      activities: Activity[];
      totalMinutes: number;
      totalCalories: number;
    }[]
  >([]);
  const theme = useTheme();
  const [loading, setLoading] = useState(true);

  // Fetch target only (real-time)
  useEffect(() => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setTarget(docSnap.data().activityTarget || 0);
      }
    });
    return unsubscribe;
  }, [user]);

  // Fetch activities in batches
  const fetchActivities = async (loadMore = false) => {
    if (!user) return;

    const activitiesRef = collection(db, 'users', user.uid, 'activities');
    let q = query(activitiesRef, orderBy('date_time', 'desc'), limit(20));

    if (loadMore && lastDoc) {
      q = query(activitiesRef, orderBy('date_time', 'desc'), startAfter(lastDoc), limit(20));
    }

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const newActivities: Activity[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          time: data.time,
          calories_burned: data.calories_burned,
          details: data.details,
          date_time: data.date_time,
        };
      });

      setActivities((prev) => (loadMore ? [...prev, ...newActivities] : newActivities));

      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      setLastDoc(lastVisible);
      setHasMore(snapshot.docs.length === 20);
    } else {
      setHasMore(false);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchActivities(false);
  }, [user]);

  // Process daily + weekly data
  useEffect(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const weeklyActivities = activities
      .filter((activity) => {
        const activityDate = activity.date_time ? activity.date_time.toDate() : null;
        return activityDate && isWithinInterval(activityDate, { start: weekStart, end: weekEnd });
      })
      .sort((a, b) => b.date_time.toDate().getTime() - a.date_time.toDate().getTime());

    const nonWeeklyActivities = activities
      .filter((activity) => {
        const activityDate = activity.date_time ? activity.date_time.toDate() : null;
        return activityDate && !isWithinInterval(activityDate, { start: weekStart, end: weekEnd });
      })
      .sort((a, b) => b.date_time.toDate().getTime() - a.date_time.toDate().getTime());

    const initialDailyData = daysOfWeek.map((date) => ({
      day: format(date, 'EEE'),
      date,
      activities: [],
      totalMinutes: 0,
      totalCalories: 0,
    }));

    const processedDailyData = initialDailyData.map((dailyData) => {
      const dailyActivities = weeklyActivities.filter((activity) =>
        activity.date_time ? isSameDay(activity.date_time.toDate(), dailyData.date) : false
      );
      return {
        ...dailyData,
        activities: dailyActivities,
        totalMinutes: dailyActivities.reduce((sum, a) => sum + parseInt(a.time, 10), 0),
        totalCalories: dailyActivities.reduce((sum, a) => sum + parseInt(a.calories_burned, 10), 0),
      };
    });

    setDailyData(processedDailyData);
    setWeeklyActivities(weeklyActivities);
    setNonWeeklyActivities(nonWeeklyActivities);

    const totalMinutes = processedDailyData.reduce((sum, d) => sum + d.totalMinutes, 0);
    setWeeklyProgress(totalMinutes / 60);
  }, [activities]);

  const updateTarget = async (increment: boolean) => {
    if (!user) return;
    const newTarget = increment ? target + 1 : Math.max(0, target - 1);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        activityTarget: newTarget,
      });
    } catch (error) {
      console.error('Error updating target:', error);
    }
  };

  const formatActivityDetails = (activity: Activity) => {
    if (Array.isArray(activity.details)) {
      return (
        <List dense sx={{ listStyleType: 'disc', pl: 3, py: 0 }}>
          {(activity.details as { name: string; sets_reps: string }[]).map((exercise, index) => (
            <ListItem key={index} sx={{ display: 'list-item', pl: 0 }}>
              <Typography variant="body2">
                {exercise.name} — {exercise.sets_reps}
              </Typography>
            </ListItem>
          ))}
        </List>
      );
    }
    return (
      <Typography variant="body2" color="text.primary">
        {activity.details}
      </Typography>
    );
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
            <>
              {/* Weekly Activities */}
              {weeklyActivities?.length > 0 && (
                <>
                  <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 'bold', ml: 1, fontSize: 17, mt: 2, mb: 2 }}>
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
                  <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 'bold', ml: 1, fontSize: 17, mt: 4, mb: 2 }}>
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

              {/* Load More Button / No More */}
              <Box display="flex" justifyContent="center" mt={2}>
                {hasMore ? (
                  <Button onClick={() => fetchActivities(true)}>Load More</Button>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No more activities
                  </Typography>
                )}
              </Box>
            </>
          </Collapse>
        </Box>
      </CardContent>
    </Card>
  );
}