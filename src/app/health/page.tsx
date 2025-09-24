'use client';
import SymptomCheckCard from "@/components/symptom_check/SymptomCheckCard";
import { useState } from "react";
import ChatCard from "@/components/chat/ChatCard";
import {
  Box,
} from '@mui/material';


interface Message {
  id: number;
  text: string;
  sender: 'me' | 'other';
  timestamp: string;
}

const sampleMessages: Message[] = [
  { id: 1, text: 'Hey!', sender: 'other', timestamp: '10:00 AM' },
  { id: 2, text: 'Hi, how are you?', sender: 'me', timestamp: '10:01 AM' },
  { id: 3, text: "I'm good, thanks!", sender: 'other', timestamp: '10:02 AM' },
];

export default function HealthPage() {
    const [symptomInput, setSymptomInput] = useState('');
    const [messages, setMessages] = useState<Message[]>(sampleMessages);

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