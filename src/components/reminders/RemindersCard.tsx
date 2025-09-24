'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  Alert,
} from '@mui/material';
import { Edit as EditIcon, Check as CheckIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, setDoc, updateDoc, deleteField } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Reminder {
  id: string;
  title: string;
  date: string;
  time?: string;
}

function sortReminders(reminders: Reminder[]): Reminder[] {
  return [...reminders].sort((a, b) => {
    const aDate = new Date(a.date + (a.time ? 'T' + a.time : ''));
    const bDate = new Date(b.date + (b.time ? 'T' + b.time : ''));
    return aDate.getTime() - bDate.getTime();
  });
}

export default function RemindersCard() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Fetch reminders from Firestore
  useEffect(() => {
    const fetchReminders = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const remindersArr = data.reminders || [];

          // Sort reminders by date and time ascending
          sortReminders(remindersArr);
          setReminders(remindersArr);
        }
      } catch (err) {
        setError('Failed to fetch reminders.');
      }
      setLoading(false);
    };
    fetchReminders();
  }, [user]);

  // Add reminder
  const handleAddReminder = async () => {
    if (!user || !newTitle || !newDate) return;
    setError(null);
    const id = Date.now().toString();
    const newReminder: Reminder = { id, title: newTitle, date: newDate, time: newTime };
    try {
      const updatedReminders = sortReminders([...reminders, newReminder]);
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, { reminders: updatedReminders });
      setReminders(updatedReminders);
      setDialogOpen(false);
      setNewTitle('');
      setNewDate('');
      setNewTime('');
    } catch (err) {
      setError('Failed to add reminder.');
    }
  };

  // Remove reminder
  const handleRemoveReminder = async (id: string) => {
    if (!user) return;
    setError(null);
    try {
      const updatedReminders = reminders.filter(r => r.id !== id);
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, { reminders: updatedReminders });
      setReminders(updatedReminders);
    } catch (err) {
      setError('Failed to remove reminder.');
    }
  };

  return (
    <Card sx={{ height: '100%', bgcolor: 'background.paper' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" component="h2" color="primary.main" fontWeight={600}>
            Reminders
          </Typography>
          <IconButton color="primary" size="small" onClick={() => setDialogOpen(true)}>
            <EditIcon />
          </IconButton>
        </Box>
        {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
        <List sx={{ py: 0 }}>
          {reminders.map((reminder) => (
            <ListItem key={reminder.id} sx={{ px: 0, py: 0 }}
              secondaryAction={
                <IconButton edge="end" color="success" onClick={() => handleRemoveReminder(reminder.id)}>
                  <CheckIcon />
                </IconButton>
              }
            >
              <ListItemText
                primary={reminder.title}
                secondary={reminder.time
                  ? format(new Date(reminder.date + 'T' + reminder.time), "dd MMM, yyyy, p")
                  : format(new Date(reminder.date), "dd MMM, yyyy")}
              />
            </ListItem>
          ))}
        </List>
        {/* Add Reminder Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
          <DialogTitle>Add Reminder</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Title"
              fullWidth
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Date"
              type="date"
              fullWidth
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Time (optional)"
              type="time"
              fullWidth
              value={newTime}
              onChange={e => setNewTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddReminder} variant="contained" disabled={!newTitle || !newDate}>Add</Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}
