"use client";

import { Box, Card, CardActions, CardContent, CardMedia, Button, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';

export default function MealCard() {
  const router = useRouter();

  return (
    <Card sx={{ display: 'flex', flexDirection: 'column' }}>
      <CardMedia
        component="img"
        height="260"
        image="/mealPic.jpeg"
        alt="Healthy meals"
        sx={{ objectFit:'cover', objectPosition: 'center 0%'}}
      />
      <CardContent>
        <Typography gutterBottom variant="h6" color='primary.light' component="div" fontWeight={'bold'}>
          Explore Healthy Meals
        </Typography>
        <Typography variant="body1" paragraph>
          Discover new meal ideas tailored to your preferances using our AI meal planner. 
          Browse and save recipes to your profile.
          Plan and track nutritious meals everyday to meet your goals.
          Take control of what you put in your body today.
        </Typography>
        <Typography variant='body1' >
          Healthy meals fuel healthy bodies!
        </Typography>
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
        <Button size="large" variant="contained" onClick={() => router.push('/meals')}>
          Go to Meals
        </Button>
      </CardActions>
    </Card>
  );
}


