'use client';
import SymptomCheckCard from "@/components/symptom_check/SymptomCheckCard";
import { useState } from "react";
import ChatCard from "@/components/chat/ChatCard";
import {
  Box,
} from '@mui/material';


export default function HealthPage() {
    const [symptomInput, setSymptomInput] = useState('');
    // const [messages, setMessages] = useState<Message[]>(sampleMessages);

    return (
    <Box display={'flex'} flexDirection={'column'} gap={3} sx={{maxWidth: 1200, py: 1, mx: 'auto'}}>
    <SymptomCheckCard 
        value={symptomInput} 
        onChange={(e) => setSymptomInput(e.target.value)} 
        placeholder="Feeling sick? Write your symptoms here. E.g. 'I have had a sore throat and runny nose for 2 days. My appetite has also been smaller.'"
    />
    <ChatCard />
  </Box>
    );
}