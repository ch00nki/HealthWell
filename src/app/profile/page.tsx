'use client';

import { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, TextField, MenuItem, Button, CircularProgress, Divider, Alert, Snackbar, List, ListItem, ListItemText } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Use Box for layout instead of Grid due to TypeScript issues
import { styled } from '@mui/material/styles';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';

// Profile pic cropper & uploader (PROFILEPHOTO)
import Cropper from 'react-easy-crop';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import Slider from '@mui/material/Slider';
import Modal from '@mui/material/Modal';
import getCroppedImg from '@/utils/cropImage';
import { Area } from 'react-easy-crop';

const GridBox = styled(Box)(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(3),
  gridTemplateColumns: 'repeat(12, 1fr)',
  '& > *': {
    gridColumn: 'span 12',
    '@media (min-width: 600px)': {
      gridColumn: 'span 6',
    },
  },
}));

interface UserProfile {
  age: number;
  height: number;
  weight: number;
  gender: 'male' | 'female' | 'other';
  activityLevel: number;
  name: string;
  email: string;
  bmi?: number;
  maintenanceCalories?: number;
  profilePhotoPath?: string;
}

const activityLevels = {
  1: 'Sedentary (office job, little exercise)',
  2: 'Light Activity (light exercise 1-3 days/week)',
  3: 'Moderate Activity (moderate exercise 3-5 days/week)',
  4: 'Very Active (hard exercise 6-7 days/week)',
  5: 'Extra Active (athletic training, physical job)',
};

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile>({
    age: 0,
    height: 0,
    weight: 0,
    gender: 'other',
    activityLevel: 1,
    name: '',
    email: '',
  });
  //profile photo (PROFILEPHOTO)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);

  // Download URL, from the photopath
  const [profilePhotoURL, setProfilePhotoURL] = useState<string>('/placeholder.png');

  // BMI calculation
  const calculateBMI = () => {
    return profile.height > 0 
      ? Number((profile.weight / ((profile.height / 100) ** 2)).toFixed(1))
      : 0;
  };

  // BMI category
  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal weight';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  };

  // Basic BMR using Mifflin-St Jeor Equation
  const calculateBMR = () => {
    if (!profile.weight || !profile.height || !profile.age) return 0;
    
    const base = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age;
    return profile.gender === 'male' ? base + 5 : base - 161;
  };

  // Activity multipliers
  const activityMultipliers = {
    1: 1.2,   // Sedentary
    2: 1.375, // Light activity
    3: 1.55,  // Moderate activity
    4: 1.725, // Very active
    5: 1.9,   // Extra active
  };

  const calculateMaintenanceCalories = () => {
    return Math.round(
      calculateBMR() * activityMultipliers[profile.activityLevel as keyof typeof activityMultipliers]
    );
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log('Fetched user data:', data);
          setProfile(prev => ({
            ...prev,
            ...data,
          }));
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Failed to load profile data');
      }
      
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setError(null);
    try {
      const bmi = calculateBMI();
      const calories = calculateMaintenanceCalories();
      
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, {
        ...profile,
        bmi,
        maintenanceCalories: calories,
      }, { merge: true });
      setShowSuccess(true);
      
      // Update local profile with calculated values
      setProfile(prev => ({
        ...prev,
        bmi,
        maintenanceCalories: calories
      }));
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Failed to save profile changes');
    }
    setSaving(false);
  };

  // Whenever profilePath changes, get and set profilePhotoURL
  useEffect(() => {
    if (profile.profilePhotoPath) {
      fetchProfilePhotoURL(profile.profilePhotoPath).then(url => setProfilePhotoURL(url));
    } else {
      setProfilePhotoURL('/placeholder.png');
    }
  }, [profile.profilePhotoPath]);

  //Profile Pic Get DownloadURL
  const fetchProfilePhotoURL = async (path: string | undefined) => {
    if (!path) return "/placeholder.png";
    try {
      const storageRef = ref(storage, path);
      return await getDownloadURL(storageRef);
    } catch (err) {
      console.error("Error fetching profile photo URL:", err);
      return "/placeholder.png"; // fallback
    }
  };

  //Crop function (PROFILEPHOTO)
    const handleCropAndUpload = async () => {
      if (!selectedImage || !croppedAreaPixels || !user) return;

      try {
        // Step 1: get cropped Blob (binary img file)
        const croppedBlob = await getCroppedImg(
          URL.createObjectURL(selectedImage),
          croppedAreaPixels
        );

        // Step 2: delete old photo from storage if exists
        if (profile.profilePhotoPath){
          const oldstorageRef = ref(storage, profile.profilePhotoPath);
          await deleteObject(oldstorageRef).catch((err) => {
            console.warn('Failed to delete old profile photo:', err.message);
          });
        }

        // Step 3: upload new cropped image
        const photoPath = `profilePhotos/${user.uid}_${uuidv4()}.jpg`
        const storageRef = ref(storage, photoPath);
        console.log(user?.uid)
        await uploadBytes(storageRef, croppedBlob);

        // Step 4: Save new photo URL and path to Firestore
        const docRef = doc(db, 'users', user.uid);
        await setDoc(docRef, { profilePhotoPath: photoPath }, { merge: true });

        // Update local states
        setProfile((prev) => ({ ...prev, profilePhotoPath: photoPath }));
        setCropModalOpen(false);
        setSelectedImage(null);

      } catch (err) {
        console.error('Error uploading cropped image:', err);
      }
    };
  //Crop function (PROFILEPHOTO)

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" component="h1" color="primary.main" fontWeight={600} gutterBottom>
            Profile Information
          </Typography>

          {/* Profile pic (PROFILEPHOTO)*/}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 150,
                height: 150,
                borderRadius: '50%',
                overflow: 'hidden',
                bgcolor: '#eee',
                mb: 0,
                border: '2px solid #ccc',
              }}
            >
              <img
                src={profilePhotoURL || '/placeholder.png'} // default fallback
                alt="Profile" // alt text if img fail load
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Box>
            <Button
              variant="text"
              sx={{ color: 'primary.light', textDecoration: 'underline', '&:hover': 
                { textDecoration: 'underline', color: 'secondary.light', backgroundColor: 'transparent' } 
              }}
              onClick={() => document.getElementById('imageInput')?.click()}
            >
              Set profile picture
            </Button>
            {/* hidden input touched by button */}
            <input
              id="imageInput"
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setSelectedImage(file);
                  setCropModalOpen(true);
                }
              }}
            />
          </Box>

          <Modal open={cropModalOpen} onClose={() => setCropModalOpen(false)}>
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '90%',
                maxWidth: 400,
                bgcolor: 'background.paper',
                boxShadow: 24,
                p: 3,
                borderRadius: 2,
              }}
            >
              <Box sx={{ position: 'relative', width: '100%', height: 300, mb: 2 }}>
                {selectedImage && (
                  <Cropper
                    // temp local URL to preview image
                    image={URL.createObjectURL(selectedImage)}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={(_, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
                  />
                )}
              </Box>
              <Slider
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(_, newZoom) => setZoom(newZoom as number)}
                sx={{ mb: 2 }}
              />
              <Button fullWidth variant="contained" onClick={handleCropAndUpload}>
                Save Profile Picture
              </Button>
            </Box>
          </Modal>

          {/* Profile pic (PROFILEPHOTO)*/}
          
          <Box sx={{ 
            display: 'flex',
            flexWrap: 'wrap',
            gap: 3,
            mt: 1
          }}>
            
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)' } }}>
              <TextField
                fullWidth
                label="Full Name"
                value={profile.name || ''}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                required
              />
            </Box>

            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)' } }}>
              <TextField
                fullWidth
                label="Age"
                type="number"
                value={profile.age || ''}
                onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })}
                slotProps={{ htmlInput: { min: 0 } }}
              />
            </Box>
            
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)' } }}>
              <TextField
                fullWidth
                label="Height (cm)"
                type="number"
                value={profile.height || ''}
                onChange={(e) => setProfile({ ...profile, height: Number(e.target.value) })}
                slotProps={{ htmlInput: { min: 0 } }}
              />
            </Box>

            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)' } }}>
              <TextField
                fullWidth
                label="Weight (kg)"
                type="number"
                value={profile.weight || ''}
                onChange={(e) => setProfile({ ...profile, weight: Number(e.target.value) })}
                slotProps={{ htmlInput: { min: 0 } }}
              />
            </Box>

            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)' } }}>
              <TextField
                fullWidth
                select
                label="Gender"
                value={profile.gender}
                onChange={(e) => setProfile({ ...profile, gender: e.target.value as UserProfile['gender'] })}
              >
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Box>

            <Box sx={{ flex: '1 1 100%' }}>
              <TextField
                fullWidth
                select
                label="Activity Level"
                value={profile.activityLevel}
                onChange={(e) => setProfile({ ...profile, activityLevel: Number(e.target.value) })}
                helperText="Select your typical weekly activity level"
              >
                {Object.entries(activityLevels).map(([level, description]) => (
                  <MenuItem key={level} value={level}>
                    Level {level}: {description}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            {error && (
              <Box sx={{ flex: '1 1 100%' }}>
                <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
              </Box>
            )}

            <Box sx={{ flex: '1 1 100%' }}>
              <Button 
                variant="contained" 
                onClick={handleSave}
                disabled={saving}
                sx={{ mt: 2 }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h5" color="primary.main" fontWeight={600} gutterBottom>
            Health Metrics
          </Typography>

          <Box sx={{ 
            display: 'flex',
            flexWrap: 'wrap',
            gap: 3,
            mt: 3
          }}>
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)' } }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    BMI
                  </Typography>
                  <Typography variant="h4">
                    {Number(profile.bmi?.toFixed(1)) || ''}
                  </Typography>
                    {profile.bmi ? (
                      <Typography variant="body2" color="text.secondary">
                        {getBMICategory(profile.bmi)}
                      </Typography>
                    ) : (
                      <Typography variant="h6" color="red">
                        Complete profile to calculate
                      </Typography>
                    )}
                </CardContent>
              </Card>
            </Box>
            
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)' } }}>
              <Card variant="outlined" sx={{m:0}}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Maintenance Calories (Estimated)
                  </Typography>
                  <Typography variant="h4">
                    {profile.maintenanceCalories || ''}
                  </Typography>
                  
                    {profile.maintenanceCalories ? (
                      <Typography variant="body2" color="text.secondary">
                        kcal/day
                      </Typography> 
                    ) : ( 
                      <Typography variant="h6" color="red">
                        Complete profile to calculate
                      </Typography>
                    )}
                  
                </CardContent>
              </Card>
            </Box>
          </Box>
          <Typography variant="h6" fontWeight={600} color="primary.main" sx={{ m: 2, mb: 0 }}>
            Calorie Guide
          </Typography>
          <List sx={{ pl: 2 , pt:0 }}>
            <ListItem disablePadding alignItems="flex-start">
            <ArrowRightIcon sx={{ mr: 1 }} />
              <ListItemText primary="Weight Loss: Calorie deficit" />
            </ListItem>
            <List sx={{ pl: 6, pt: 0, pb: 0 }}>
              <ListItem disablePadding>
              <Typography component="span" sx={{ mr: 1, fontSize: '1.2rem', lineHeight: 1 }}>&bull;</Typography>
                <ListItemText primary="Slow Loss: 100-300 kcal deficit (slow fat loss, maintain muscle)" />
              </ListItem>
              <ListItem disablePadding>
                <Typography component="span" sx={{ mr: 1, fontSize: '1.2rem', lineHeight: 1 }}>&bull;</Typography>
                <ListItemText primary="Fast Loss: 300-500 kcal deficit (faster fat loss, lose more muscle)" />
              </ListItem>
            </List>
            <ListItem disablePadding alignItems="flex-start">
            <ArrowRightIcon sx={{ mr: 1 }} />
              <ListItemText primary="Weight Gain: Calorie surplus" />
            </ListItem>
            <List sx={{ pl: 6, pt: 0, pb: 0 }}>
              <ListItem disablePadding>
                <Typography component="span" sx={{ mr: 1, fontSize: '1.2rem', lineHeight: 1 }}>&bull;</Typography>
                <ListItemText primary="Slow Gain: 100-300 kcal surplus (slow muscle gain, less fat)" />
              </ListItem>
              <ListItem disablePadding>
                <Typography component="span" sx={{ mr: 1, fontSize: '1.2rem', lineHeight: 1 }}>&bull;</Typography>
                <ListItemText primary="Fast Gain: 300-500 kcal surplus (faster muscle gain, more fat)" />
              </ListItem>
            </List>
          </List>
        </CardContent>
      </Card>

      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={() => setShowSuccess(false)}
        message="Profile updated successfully"
      />
    </Box>
  );
}
