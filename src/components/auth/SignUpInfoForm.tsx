"use client";

import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useAuth } from "@/contexts/AuthContext";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

const activityLevels = {
  1: "Sedentary (office job, little exercise)",
  2: "Light Activity (light exercise 1-3 days/week)",
  3: "Moderate Activity (moderate exercise 3-5 days/week)",
  4: "Very Active (hard exercise 6-7 days/week)",
  5: "Extra Active (athletic training, physical job)",
};

export default function SignUpInfoForm() {
  const { user } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    age: "",
    height: "",
    weight: "",
    gender: "other",
    activityLevel: 1,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const activityMultipliers = {
    1: 1.2,
    2: 1.375,
    3: 1.55,
    4: 1.725,
    5: 1.9,
  };

  const calculateBMI = (weight: number, height: number) =>
    height > 0 ? Number((weight / ((height / 100) ** 2)).toFixed(1)) : 0;

  const calculateBMR = (weight: number, height: number, age: number, gender: string) => {
    if (!weight || !height || !age) return 0;
    const base = 10 * weight + 6.25 * height - 5 * age;
    return gender === "male" ? base + 5 : base - 161;
  };

  const calculateMaintenanceCalories = (bmr: number, activityLevel: number) =>
    Math.round(bmr * activityMultipliers[activityLevel as keyof typeof activityMultipliers]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!user) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }

    const { name, age, height, weight, gender } = form;
    const activityLevel = Number(form.activityLevel);

    if (!name.trim() || !age || !height || !weight) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    const numAge = Number(age);
    const numHeight = Number(height);
    const numWeight = Number(weight);

    const bmi = calculateBMI(numWeight, numHeight);
    const bmr = calculateBMR(numWeight, numHeight, numAge, gender);
    const maintenanceCalories = calculateMaintenanceCalories(bmr, activityLevel);

    try {
      const docRef = doc(db, "users", user.uid);
      await setDoc(
        docRef,
        {
          name,
          age: numAge,
          height: numHeight,
          weight: numWeight,
          gender,
          activityLevel,
          bmi,
          maintenanceCalories,
        },
        { merge: true }
      );
      router.push("/");
    } catch {
      setError("Failed to save info. Please try again.");
    }

    setLoading(false);
  };

  const handleSkip = () => {
    router.push("/");
  }

  return (
    <Card sx={{ p: 3, maxWidth: 420, width: "100%", borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h5" component="h1" color="primary.dark" fontWeight={600} gutterBottom align="center">
          Complete Your Profile
        </Typography>
        <Typography variant="body1" align="center" sx={{ mb: 3 }}>
          Please enter your details to get started
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {/* ✅ New Name Field */}
          <TextField
            fullWidth
            label="Full Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            sx={{ mb: 2 }}
            required
          />

          <TextField
            fullWidth
            label="Age"
            name="age"
            type="number"
            value={form.age}
            onChange={handleChange}
            sx={{ mb: 2 }}
            InputProps={{ inputProps: { min: 0, max: 120 } }}
            required
          />
          <TextField
            fullWidth
            label="Height (cm)"
            name="height"
            type="number"
            value={form.height}
            onChange={handleChange}
            sx={{ mb: 2 }}
            InputProps={{ inputProps: { min: 0, max: 300 } }}
            required
          />
          <TextField
            fullWidth
            label="Weight (kg)"
            name="weight"
            type="number"
            value={form.weight}
            onChange={handleChange}
            sx={{ mb: 2 }}
            InputProps={{ inputProps: { min: 0, max: 500 } }}
            required
          />
          <TextField
            fullWidth
            select
            label="Gender"
            name="gender"
            value={form.gender}
            onChange={handleChange}
            sx={{ mb: 2 }}
            required
          >
            <MenuItem value="male">Male</MenuItem>
            <MenuItem value="female">Female</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </TextField>
          <TextField
            fullWidth
            select
            label="Activity Level"
            name="activityLevel"
            value={form.activityLevel}
            onChange={handleChange}
            helperText="Select your typical weekly activity level"
            sx={{ mb: 3 }}
            required
          >
            {Object.entries(activityLevels).map(([level, description]) => (
              <MenuItem key={level} value={level}>
                Level {level}: {description}
              </MenuItem>
            ))}
          </TextField>
          <Box display={"flex"} justifyContent="space-between" gap={20}>
            <Button variant="contained" disabled={loading} onClick={handleSkip}>Skip</Button> 
            <Button type="submit" fullWidth variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : "Submit"}
            </Button>       
          </Box>
          
        </Box>
      </CardContent>
    </Card>
  );
}
