"use client";

import { Card, CardActions, CardContent, CardMedia, Button, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';

export default function ActivityCard() {
  const router = useRouter();

  return (
    <Card sx={{ display: 'flex', flexDirection: 'column' }}>
      <CardMedia
        component="img"
        height="260"
        image="/activityPic2.jpg"
        alt="Workout activities"
        sx={{ objectFit:'cover', objectPosition: 'center 58%'}}
      />
      <CardContent>
        <Typography gutterBottom variant="h6" component="div">
          Track Your Activities
        </Typography>
        <Typography variant="body1" paragraph>
          Formulate new workouts designed to help you reach your goals using our AI workout planner.
          Save exciting workouts to your profile.
          Log workouts and view your progress during the week.
          Stay motivated and organise your workout journey today.
        </Typography>
        <Typography>
            Stay active and keep moving!
        </Typography>
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
        <Button size="large" variant="contained" onClick={() => router.push('/activity')}>
          Go to Activities
        </Button>
      </CardActions>
    </Card>
  );
}



