import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, TextField, Button, CircularProgress, Box, Select, MenuItem, List, ListItem, Divider, Paper } from '@mui/material';
import { doc, collection, addDoc,onSnapshot, serverTimestamp, getDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { create } from 'domain';
// import { v4 as uuidv4 } from 'uuid';

interface RecipeMakerCardProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

const RecipeMakerCard: React.FC<RecipeMakerCardProps> = ({ value, onChange, placeholder }) => {
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<
  {
    title?: string;
    ingredients?: {name:string, quantity:string}[];
    instructions?: string[];
    time?: string;
    servings?: string;
    nutrition?: 
    {calories: string, protein: string, carbs: string, fats: string};
    prompt?: string;
    id?: string;
  } | null>(null);
  const [recipeSaved, setRecipeSaved] = useState(false)
  const [error, setError] = useState<string | null>(null);
  const [ai, setAI] = useState<string>('ChatGPT');
  // IN PRODUCTION, SET ENV VARIABLE NEXT_PUBLIC_API_URL IN VERCEL
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

  const { user } = useAuth();

  const [saveLoading, setSaveLoading] = useState(false)

  // On componnent mount, load recipe from local storage if available
  useEffect(() => {
    const recipeFromStorage = localStorage.getItem("recipeGenerated");
    if (recipeFromStorage) {
      setRecipe(JSON.parse(recipeFromStorage));
    }
  }, []);

  // Listen to a single recipe document and track if it's saved
  useEffect(() => {
    if (!user || !recipe?.id) return;

    setSaveLoading(true);
    const userWorkoutsRef = collection(db, "users", user.uid, "recipes");
    const workoutDocRef = doc(userWorkoutsRef, recipe.id);

    const unsubscribe = onSnapshot(workoutDocRef, (recipeSnap) => {
      if (recipeSnap.exists()) {
        setRecipeSaved(true);
      } else {
        setRecipeSaved(false);
      }
      setSaveLoading(false);
    });
    // Clean up listener on unmount or
    // Clean up & restart listener when dependency change (new workout id)
    return () => unsubscribe();
  }, [user, recipe?.id]);
  

  const saveRecipe = async () => {
    if (!user || !recipe) return;
    setSaveLoading(true)
    try {
      const userRecipesRef = collection(db, 'users', user.uid, 'recipes');
      const docRef = await addDoc(userRecipesRef, recipe);
      setRecipe({
        ...recipe,
        id: docRef.id
      })
      localStorage.setItem(
          "recipeGenerated",
          JSON.stringify({ ...recipe, id: docRef.id })
        );
      setRecipeSaved(true)
    } catch (err) {
      console.error('Error saving recipe:', err);
      setError('Failed to save recipe to your profile.');
    } finally {
      setSaveLoading(false)
    }
  };

  const clear = () => {
    setRecipe(null)
    localStorage.removeItem("recipeGenerated")
    setRecipeSaved(false)
  }

  const handleSubmit = async () => {
    if (!value.trim()) return;
    setLoading(true);
    setRecipe(null);
    localStorage.removeItem("recipeGenerated")
    setError(null);
    setRecipeSaved(false)
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
          type: "recipe"
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate recipe');
      }

      const data = await response.json();
      const recipeData = {
        ...data.content,
        prompt: value,
        // id: uuidv4()
      }
      setRecipe(recipeData);
      localStorage.setItem("recipeGenerated", JSON.stringify(recipeData));
      // if (user) {
      //   await saveRecipe(recipeData);
      // }
    } catch (err: any) {
      setError('Failed to generate recipe. Please try again.');
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

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" component="h2" color="primary.main" gutterBottom fontWeight={600}>
          AI Recipe Generator
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={2}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "What would you like to cook? Include any dietary restrictions or preferences."}
          disabled={loading}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={loading || !value.trim()}
          >
            Generate Recipe
          </Button>
          {loading && <CircularProgress size={24} sx={{ ml: 2 }} />}
          <Select value={ai} onChange={(e) => setAI(e.target.value)} size='small' variant='standard' sx={{ml:2}}>
            <MenuItem value="ChatGPT">ChatGPT</MenuItem>
          </Select>
          {recipe &&
            <Button
              variant='contained'
              onClick={clear}
              sx={{ml:'auto'}}>
              Clear Recipe
            </Button>}
        </Box>

        {/* RECIPE */}
        {recipe && (
          <Paper elevation={2} sx={{ mt: 3, p: 3, bgcolor: 'background.paper' }}>
            <Typography variant="h5" color="primary.light" sx={{fontWeight:"bold"}} gutterBottom>
              {recipe.title || 'Your Recipe'}
            </Typography>
            
            <Box sx={{ mb: 1 }}>
              <Typography variant="subtitle1" color="text.secondary" sx={{fontWeight:'bold'}}>
                Ingredients:
              </Typography>
              <List sx={{ listStyleType: 'disc', pl: 2.5 , pt: 0 }}>
                {Array.isArray(recipe.ingredients) && recipe.ingredients.length>0 ? (
                  recipe.ingredients.map((ingredient, index) => (
                    <ListItem key={index} sx={{ display: 'list-item', pl: 0.5, py: 0.4 }}>
                      <Typography>
                        {ingredient.name} — {ingredient.quantity}
                      </Typography>
                    </ListItem>
                  ))
                ) : (
                  <ListItem sx={{ pl: 0.5, py:0.4 }}>
                    <Typography> No ingredients provided </Typography>
                  </ListItem>
                )}
              </List>
            </Box>

            <Box sx={{ mb: 1 }}>
              <Typography variant="subtitle1" color="text.secondary" sx={{fontWeight:'bold'}}>
                Instructions:
              </Typography>
              <List sx={{ listStyleType: 'decimal', pl: 2.5, pt:0 }}>
                {Array.isArray(recipe.instructions) && recipe.instructions.length>0 ? (
                  recipe.instructions.map((instruction, index) => (
                    <ListItem key={index} sx={{ display: 'list-item', pl: 0.5, py: 0.4 }}>
                      <Typography>{instruction}</Typography>
                    </ListItem>
                  ))
                ) : (
                  <ListItem sx={{ pl: 0.5, py:0.4 }}>
                    <Typography> No instructions provided </Typography>
                  </ListItem>
                )}
              </List>
            </Box>

            <Box >
              <Typography variant='subtitle1' color='text.secondary' sx={{fontWeight:"bold"}}>
                Estimated time:
              </Typography>
              <Typography paragraph sx={{pl:0.2}}>
                {recipe.time || "No estimated time provided"}
              </Typography>
            </Box>

            
            <Box >
              <Typography variant='subtitle1' color='text.secondary' sx={{fontWeight:"bold"}}>
                Serving size:
              </Typography>
              <Typography paragraph sx={{pl:0.2}}>
                {recipe.servings || "No serving size provided"}
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle1" color="text.secondary">
                Nutritional Information:
              </Typography>
              <List sx={{listStyleType: "disc", pl: 2.5, pt:0}}>
                {recipe.nutrition && typeof recipe.nutrition === "object" 
                  && Object.keys(recipe.nutrition).length > 0 ? (
                    <>
                    <ListItem sx={{ display: 'list-item', pl: 0.5, py: 0.4 }}>
                      <Typography>Calories: {recipe.nutrition.calories}</Typography>
                    </ListItem>
                    <ListItem sx={{ display: 'list-item', pl: 0.5, py: 0.4 }}>
                      <Typography>Protein: {recipe.nutrition.protein}</Typography>
                    </ListItem>
                    <ListItem sx={{ display: 'list-item', pl: 0.5, py: 0.4 }}>
                      <Typography>Carbohydrates: {recipe.nutrition.carbs}</Typography>
                    </ListItem>
                    <ListItem sx={{ display: 'list-item', pl: 0.5, py: 0.4 }}>
                      <Typography>Fats: {recipe.nutrition.fats}</Typography>
                    </ListItem>
                    </>
                  ) : (
                    <ListItem sx={{ pl: 0.5, py:0.4 }}>
                      <Typography> No nutritional information provided </Typography>
                    </ListItem>
                  )}
              </List>
            </Box>
            <Box display="flex" justifyContent={"flex-end"}>
              <Button
                variant='contained'
                onClick={saveRecipe}
                size="large"
                disabled={recipeSaved || saveLoading}>
                {recipeSaved ? "Saved":"Save"}
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

export default RecipeMakerCard;
