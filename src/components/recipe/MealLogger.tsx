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
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns'

interface SavedRecipe {
  id: string;
  title: string;
  nutrition: {calories: string, carbs: string, fats: string, protein: string};
  servings: string;
}

interface CustomMeal {
  title: string;
  calories: string;
  protein: string;
  carbs: string;
  fats: string;
}

export default function MealLogger() {
  const { user } = useAuth();
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  // Save selected saved recipe as ID and match to savedRecipes to get details
  const [selectedRecipeID, setSelectedRecipeID] = useState<string>('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Custom activity state
  const [customMeal, setCustomMeal] = useState<CustomMeal>({
    title: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: ''
  });

  const [textFieldDisabled, setTextFieldDisabled] = useState(false);
  const [servingsDisabled, setServingsDisabled] = useState(true)
  const [servings, setServings] = useState<string>('');

  const [submitError, setSubmitError] = useState(false)

  const [loading, setLoading] = useState(false)

  // Fetch saved workouts
  useEffect(() => {
    if (!user) return;

    const userRecipesRef = collection(db, 'users', user.uid, 'recipes');
    const q = query(userRecipesRef, orderBy('title', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRecipes: SavedRecipe[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedRecipes.push({
          id: doc.id,
          title: data.title,
          nutrition: data.nutrition,
          servings: data.servings
        });
      });
      setSavedRecipes(fetchedRecipes);
    });

    return () => unsubscribe();
  }, [user]);

  // whenever selectedMealID changes, reset customactivity fields and disable them
  useEffect(() => {
    if (selectedRecipeID) {
      setCustomMeal({
        title: '',
        calories: '',
        protein: '',
        carbs: '',
        fats: '',
      });
      setTextFieldDisabled(true);
      setServingsDisabled(false)
    }
    // WHen selectedMealID = '', enable custom activity fields again
    else {
        setServings('')
        setServingsDisabled(true)
        setTextFieldDisabled(false)
    }
  }, [selectedRecipeID]);

  const handleCustomActivityChange = (field: keyof CustomMeal) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCustomMeal((prev) => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const saveMeal = async () => {
    if (!user) return;
    try {
      setLoading(true)
      setSubmitError(false)
      const mealsRef = collection(db, 'users', user.uid, 'meals');
      const now = new Date()
      if (selectedRecipeID) {
        const recipe = savedRecipes.find(r => r.id === selectedRecipeID);
        if (!recipe) return;
        const servings_eaten = parseInt(servings, 10)
        if (servings_eaten<0){
            setSubmitError(true)
            setSnackbarMessage("Invalid entries!")
            setOpenSnackbar(true)
            return;
        }
        // THE LETTER IS IGNORED IN PARSEINT LOL
        const recipe_servings = parseInt(recipe.servings, 10)
        const calories_eaten = parseInt(recipe.nutrition.calories, 10)/recipe_servings*servings_eaten
        const protein_eaten = parseInt(recipe.nutrition.protein)/recipe_servings*servings_eaten
        const carbs_eaten = parseInt(recipe.nutrition.carbs)/recipe_servings*servings_eaten
        const fats_eaten = parseInt(recipe.nutrition.fats)/recipe_servings*servings_eaten
        await addDoc(mealsRef, {
            title: recipe.title,
            calories: calories_eaten,
            protein: protein_eaten,
            carbs: carbs_eaten,
            fats: fats_eaten,
            date_time: serverTimestamp()
        });
        setSelectedRecipeID('');
        setServings('')
        setSnackbarMessage(`Saved meal logged successfully on ${format(now, "MMM d, yyyy h:mm a")}!`);
        setOpenSnackbar(true);}
      else {
        if (parseInt(customMeal.calories,10)<0 || parseInt(customMeal.protein,10)<0 ||
        parseInt(customMeal.carbs,10)<0 || parseInt(customMeal.fats,10)<0){
            setSubmitError(true)
            setSnackbarMessage("Invalid entries!")
            setOpenSnackbar(true)
            return;
        }
        await addDoc(mealsRef, {
            title: customMeal.title,
            calories: parseInt(customMeal.calories,10),
            protein: parseInt(customMeal.protein,10),
            carbs: parseInt(customMeal.carbs,10),
            fats: parseInt(customMeal.fats,10),
            date_time: serverTimestamp(),
        });
        setCustomMeal({
            title: '',
            calories: '',
            protein: '',
            carbs: '',
            fats: '',
        });
        setSnackbarMessage(`Custom meal logged successfully on ${format(now, "MMM d, yyyy h:mm a")}!`);
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

  return (
    // height 100% makes it stretch to fill container
    <Card sx={{height:'100%', overflowY: 'auto', scrollbarWidth: 'thin'}}>
      <CardContent sx={{ display:'flex', flexDirection:'column'}}>
        <Typography variant="h6" component="h2" color="primary.main" gutterBottom fontWeight={600}
        sx={{mb:1,}}>
          Meal Logger
        </Typography>

        {/* Custom Activity Section */}
        <Box>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom fontWeight={600}
          sx={{mb:1.7}}>
            Log Custom Meal
          </Typography>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Meal Title"
              value={customMeal.title}
              onChange={handleCustomActivityChange('title')}
              size="small"
              disabled={textFieldDisabled}
            />
            <TextField
              fullWidth
              label="Calories (kcal)"
              value={customMeal.calories} 
              onChange={handleCustomActivityChange('calories')}
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
              label="Protein (g)"
              value={customMeal.protein}
              onChange={handleCustomActivityChange('protein')}
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
              label="Carbs (g)"
              value={customMeal.carbs}
              onChange={handleCustomActivityChange('carbs')}
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
              label="Fats (g)"
              value={customMeal.fats}
              onChange={handleCustomActivityChange('fats')}
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
            </Stack>

            <Divider sx={{mt:2, mb:3, borderBottomWidth:1.5}} />

            <Typography variant="subtitle1" color="text.secondary" fontWeight={600}
            sx={{mt:1.5, mb:1.7}}>
            Log Saved Recipe
            </Typography>
            
            <FormControl fullWidth size="small" sx={{mb:2}}>
              <InputLabel id="recipe-label">Select Recipe</InputLabel>
              <Select
                value={selectedRecipeID || ''}
                onChange={(e) => setSelectedRecipeID(e.target.value)}
                labelId="recipe-label"
                label="Select Recipe"
              >
                {/* reset selection */}
                <MenuItem value="">
                  <em>~ Select Recipe ~</em>
                </MenuItem>
                {/* saved workouts selection */}
                {savedRecipes.map((recipe) => (
                  <MenuItem key={recipe.id} value={recipe.id}>
                    {recipe.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Servings eaten"
              value={servings}
              onChange={(e)=>setServings(e.target.value)}
              type="number"
              size="small"
              slotProps={{ htmlInput: { min: 0 } }}
              disabled={servingsDisabled}
              sx={{mb:2}}
              onKeyDown={(e) => {
                if (['e', 'E', '+', '-'].includes(e.key)) {
                e.preventDefault();
                }
              }}
            />

            <Button
              variant="contained"
              fullWidth
              onClick={saveMeal}
              disabled={
              !((selectedRecipeID && servings) || 
              (customMeal.title && customMeal.calories && customMeal.protein && customMeal.carbs && customMeal.fats)
              ) || loading}
            >
              Save Meal
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
