import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box, List, ListItem, 
  CircularProgress, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface Recipe {
  id: string;
  title: string;
  ingredients: { name: string; quantity: string }[];
  nutrition: {calories: string, carbs: string, fats: string, protein: string};
  instructions: string[];
  time: string;
  servings: string;
}

export default function RecipeList() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  // For accordion, expanded is workout id or false
  const [expanded, setExpanded] = useState<string | false>(false);
  const { user } = useAuth();

  // Listener for recipes
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const userRecipesRef = collection(db, 'users', user.uid, 'recipes');
    const q = query(userRecipesRef, orderBy('title', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRecipes: Recipe[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedRecipes.push({
          id: doc.id,
          title: data.title,
          ingredients: data.ingredients,
          instructions: data.instructions,
          nutrition: data.nutrition,
          time: data.time,
          servings: data.servings,
        });
      });
      setRecipes(fetchedRecipes);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleAccordionChange = (recipeId: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? recipeId : false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" component="h2" color="primary.main" gutterBottom fontWeight={600}>
          My Saved Recipes
        </Typography>
        {recipes.length === 0 ? (
          <Typography color="text.secondary" align="center">
            No saved recipes yet
          </Typography>
        ) : (
          <Box>
            {recipes.map((recipe) => (
              <Accordion
                key={recipe.id}
                expanded={expanded === recipe.id}
                onChange={handleAccordionChange(recipe.id)}
                sx={{
                  mb: 1,
                  '&:before': {
                    display: 'none',
                  },
                  boxShadow: 'none',
                  border: 1.5,
                  borderColor: 'divider',
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls={`workout-${recipe.id}-content`}
                  id={`workout-${recipe.id}-header`}
                  sx={{
                    '&:hover': { bgcolor: 'action.hover' },
                    bgcolor: expanded === recipe.id ? 'action.selected' : 'transparent', // highlight when open
                  }}
                >
                {recipe.title && (
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {recipe.title || 'Missing Recipe Name'}
                  </Typography>
                )}
                </AccordionSummary>
                <AccordionDetails>
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

                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
