import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, TextField, Button, CircularProgress, Box, Alert, Select, MenuItem } from '@mui/material';
import { useRouter, usePathname } from 'next/navigation';

import { getAuth } from "firebase/auth";

interface SymptomCheckCardProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

// IN PRODUCTION, SET ENV VARIABLE NEXT_PUBLIC_API_URL IN VERCEL
const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

const getEndpoint = (aiModel: string) => {
  switch(aiModel) {
    case 'Fine-Tuned Flan-T5 (HF)':
      return `${BASE_URL}/flan/diagnose`;
    case 'MedLlama2-7B (Ollama)':
      return `${BASE_URL}/medLlama2/diagnose`;
    case 'MedGemma-4B (Ollama)':
      return `${BASE_URL}/medgemma/diagnose`;
    default:
      return `${BASE_URL}/flan/diagnose`;
  }
};

const SymptomCheckCard: React.FC<SymptomCheckCardProps> = ({ value, onChange, placeholder }) => {
  const [loading, setLoading] = useState(false);
  const [flanDiagnosis, setFlanDiagnosis] = useState<string | null>(null);
  const [medLlama2Diagnosis, setMedLlama2Diagnosis] = useState<string | null>(null);
  const [medGemmaDiagnosis, setMedGemmaDiagnosis] = 
  // useState<string | null>(null);
  useState<
  {
    diagnosis?: string;
    description?: string;
    treatment_options?: string[];
    urgency?: string;
    confidence_score?: string;
  } | null>(null)
  const [error, setError] = useState<string | null>(null);
  const [ai, setAI] = useState<string>('Fine-Tuned Flan-T5 (HF)'); // Default AI selection

  // SAVE DIAGNOSIS TO LOCAL STORAGE
  // 1. Load saved values when component mounts
  useEffect(() => {
    const flan = localStorage.getItem("flanDiagnosis");
    const llama = localStorage.getItem("medLlama2Diagnosis");
    const gemma = localStorage.getItem("medGemmaDiagnosis");

    if (flan) setFlanDiagnosis(flan);
    if (llama) setMedLlama2Diagnosis(llama);
    if (gemma) setMedGemmaDiagnosis(JSON.parse(gemma));
  }, []);

  // 2. Save to localStorage whenever they change
  // OR U CAN SAVE ONLY WHEN THEY ARE SET IN HANDLE SUBMIT
  useEffect(() => {
    if (flanDiagnosis) localStorage.setItem("flanDiagnosis", flanDiagnosis);
  }, [flanDiagnosis]);

  useEffect(() => {
    if (medLlama2Diagnosis) localStorage.setItem("medLlama2Diagnosis", medLlama2Diagnosis);
  }, [medLlama2Diagnosis]);

  useEffect(() => { // LocalStorange only stores strings
    if (medGemmaDiagnosis) localStorage.setItem("medGemmaDiagnosis", JSON.stringify(medGemmaDiagnosis));
  }, [medGemmaDiagnosis]);



  const handleSubmit = async () => {
    if (!value.trim()) return;
    setLoading(true);
    setFlanDiagnosis(null);
    setMedLlama2Diagnosis(null);
    setMedGemmaDiagnosis(null);
    localStorage.removeItem("flanDiagnosis");
    localStorage.removeItem("medLlama2Diagnosis");
    localStorage.removeItem("medGemmaDiagnosis");
    setError(null);

    try {
      // 🔑 Get Firebase ID token for current logged-in user
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Not logged in");
      const token = await user.getIdToken();

      if (ai === 'Fine-Tuned Flan-T5 (HF)') {
        const response = await fetch(getEndpoint(ai), {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
           },
          body: JSON.stringify({ symptoms: value }),
        });
        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        setFlanDiagnosis(data.diagnosis);
      } 
      if (ai === 'MedLlama2-7B (Ollama)') {
        const response = await fetch(getEndpoint(ai), {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ symptoms: value }),
        });
        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        // Set the diagnosis data with JSON diagnosis, description, treatment
        // urgency, and confidence score
        // NVM, not json liao, change to just text
        setMedLlama2Diagnosis(data.diagnosis);
      }
      if (ai === 'MedGemma-4B (Ollama)') {
          const response = await fetch(getEndpoint(ai), {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ symptoms: value }),
          });
          if (!response.ok) throw new Error(await response.text());
          const data = await response.json();
          setMedGemmaDiagnosis(data.diagnosis);
      } 
    } catch {
      setError("Failed to get diagnosis. Please try again.");
    } finally {
      setLoading(false);
  };
}
  // if key is enter and shift not being held same time
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  

  const clear = () => {
    setFlanDiagnosis(null);
    setMedLlama2Diagnosis(null);
    setMedGemmaDiagnosis(null);
    localStorage.removeItem("flanDiagnosis");
    localStorage.removeItem("medLlama2Diagnosis");
    localStorage.removeItem("medGemmaDiagnosis");
  }

  const router = useRouter();
  const pathname = usePathname();

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" component="h2" color="primary.main" gutterBottom fontWeight={600}>
          AI Symptom Check
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={2}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          placeholder={
            placeholder ||
            "Feeling sick? Write your symptoms here. E.g. 'I have had a sore throat and runny nose for 2 days. My appetite has also been smaller.'"
          }
          disabled={loading}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={loading || !value.trim()}
          >
            Check
          </Button>
          {loading && <CircularProgress size={24} sx={{ ml: 2 }} />}
          <Select value={ai} onChange={(e) => setAI(e.target.value)} size='small' variant='standard' sx={{ml:2}}>
            <MenuItem value="Fine-Tuned Flan-T5 (HF)">Fine-Tuned Flan-T5 (HF)</MenuItem>
            <MenuItem value="MedLlama2-7B (Ollama)">MedLlama2-7B (Ollama)</MenuItem>
            <MenuItem value="MedGemma-4B (Ollama)">MedGemma-4B (Ollama) - BEST</MenuItem>
          </Select>
          {pathname!=='/health'? (<Button
            variant='contained'
            onClick={() => router.push('/health')}
            sx={{ ml: 'auto' }}
            disabled={loading}
          >
            Go to Health Check
          </Button>) : (<Button
            variant='contained'
            onClick={clear}
            sx={{ ml: 'auto' }}
            disabled={loading}
          >
            Clear Diagnosis
          </Button>)}
        </Box>
        {flanDiagnosis && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="success">
              <strong>AI Diagnosis 🩺:</strong> You might have {flanDiagnosis}.
              <br /><br /><strong>Please take note❗: </strong> 
                Whatever information produced by our AI
                should not be taken as medical advice. 
                Always consult a qualified healthcare professional for medical concerns.
            </Alert>
          </Box>
        )}
        {medLlama2Diagnosis && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="success">
              <strong>AI Diagnosis 🩺:</strong> {medLlama2Diagnosis}
              <br /><br /><strong>Please take note❗: </strong> 
                Whatever information produced by our AI
                should not be taken as medical advice. 
                Always consult a qualified healthcare professional for medical concerns.
            </Alert>
          </Box>
        )}
        {medGemmaDiagnosis && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="success">
              {/* <strong>AI Diagnosis 🩺:</strong> {medGemmaDiagnosis} */}
              <strong>AI Diagonsis 🩺: </strong>{medGemmaDiagnosis.diagnosis}<br />
              <strong>Description: </strong>{medGemmaDiagnosis.description}<br />
              <strong>Treatment Options: </strong>
                <br />
                {/* default left padding for <ul> is 40px, make it 16px so list is more left */}
                <ul style={{ marginTop: "0px", marginBottom: "4px", paddingLeft: "16px" }}>
                  {Array.isArray(medGemmaDiagnosis.treatment_options) ? (
                    medGemmaDiagnosis.treatment_options.map((option, idx) => (
                      <li key={idx}>{option}</li>
                    ))
                  ) : (
                    <li>{medGemmaDiagnosis.treatment_options}</li>
                  )}
                </ul>
              <strong>Urgency: </strong>{medGemmaDiagnosis.urgency} <br />
              <strong>Confidence Score: </strong>{medGemmaDiagnosis.confidence_score}%
              <br /><br /><strong>Please take note❗: </strong> 
                Whatever information produced by our AI
                should not be taken as medical advice. 
                Always consult a qualified healthcare professional for medical concerns.
            </Alert>
          </Box>
        )}
        {error && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="error">
              {error}
            </Alert>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default SymptomCheckCard; 