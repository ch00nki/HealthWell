import { useRef, useEffect, useState } from 'react';
import { Box, TextField, IconButton, Paper, Typography,
    Card, CardContent, Button,
    CircularProgress, Dialog,
    DialogTitle, DialogActions, DialogContent
 } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useAuth } from '@/contexts/AuthContext';
import { collection, doc, setDoc, updateDoc, addDoc, deleteDoc, serverTimestamp, Timestamp, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { getDatabase, ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
// removed unused imports


interface Message {
  id: number;
  text: string;
  senderId: string;
  timestamp: Timestamp; //Date
}

interface UserProfile {
  role: 'user' | 'doctor';
  name: string;
  chatId?: string;
}

interface Chat {
    id?: string;
    userId?: string;
    doctorId?: string;
    createdAt?: Timestamp;
    endedBy?: {user: string, endedAt: Timestamp} | null;
    messages?: Message[] ;
}

interface Request {
    userId: string;
    status: 'pending';
    createdAt: Timestamp;
}


export default function ChatCard() {
    const { user } = useAuth();
    const [chat, setChat] = useState<Chat|null>(null);
    const [input, setInput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [profile, setProfile] = useState<UserProfile|null>(null)
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const [incomingRequests, setIncomingRequests] = useState<Request[]>([]);
    const [hasPendingRequest, setHasPendingRequest] = useState(false);


    // 1. LISTEN FETCH USER PROFILE ON ANY CHANGE IN ANY FIELD IN USER DOCUMENT
    // TO KEEP CHATID UPDATED
    useEffect(() => {
    if (!user) {
        return;
    }
    const unsubscribeProfile = onSnapshot(
        doc(db, 'users', user.uid),
        (doc) => {
        setProfile(doc.data() as UserProfile);
        },
        (error) => {
        console.error('Error fetching profile:', error);
        setError('Failed to load profile data');
        }
    );
    return () => unsubscribeProfile();
    }, [user]);

    // 2. LISTEN FETCH CHAT DETAILS WHEN PROFILE.CHATID IS UPDATED
    useEffect(() => {
    //reset chat when profile.chatId becomes null, no more listener
    if (!profile?.chatId) return;

    // Listener for chat document referenced by profile.chatId
    const chatRef = doc(db, 'chats', profile.chatId)
    const unsubscribeChat = onSnapshot(
        chatRef,
        (chatDoc) => {
        if (chatDoc.exists()) {
            const data = chatDoc.data()
            setChat(prevChat => ({
                ...prevChat,
                id: chatDoc.id,
                userId: data.userId,
                doctorId: data.doctorId,
                createdAt: data.createdAt,
                endedBy: data.endedBy ? {
                    user: data.endedBy.user,
                    endedAt: data.endedBy.endedAt? data.endedBy.endedAt
                    : null,
                } : null,
                }));
        } else {
            setChat(null); // chat doc does not exist
        }
        },
        (error) => {
        setError('Error fetching chat details')
        console.error('Error fetching chat:', error);
        }
    );
    return () => unsubscribeChat();
    }, [profile?.chatId, chat?.endedBy]);

    // 3. LISTEN FETCH MESSAGES FOR THE CURRENT CHAT.ID & IF CHAT.ID CHANGES
    useEffect(() => {
    // when chat resets, listener will stop, no need reset chat:messages bcos whole chat reset
    if (!chat || !chat?.id) return;

    const messagesRef = collection(db, 'chats', chat.id, 'messages');
    //Order messages from oldest to newest
    //This is important to ensure that the messages are displayed in the correct order
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    //sets up a listener for messages with real-time updates
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedMessages: Message[] = [];
        querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedMessages.push({
            id: data.id,
            text: data.text,
            senderId: data.senderId,
            timestamp: data.timestamp // WILL BE NULL AT FIRST, wait for it resolve
        });
        });
        setChat(prevChat => ({
            ...prevChat,
            messages: fetchedMessages || []
        }));
    });
    // clean up only runs when chatID changes or component unmounts (chatcard unmounts)
    return () => unsubscribe();
    }, [chat?.id]); //u had chat in dependencies, it changes everytime messages changes
    //so u had infinite loop

    // 4. SCROLL TO BOTTOM WHEN NEW MESSAGE IS ADDED
    useEffect(() => {
        if (!user || !chat?.messages || chat.messages.length === 0) return;
        // Scroll to bottom only if the last message is sent by the current user
        const lastMessage = chat.messages[chat.messages.length - 1];
        if (lastMessage?.senderId === user.uid){
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });}
    }, [chat?.messages, user]);


    // 5. LISTEN FETCH INCOMING REQUESTS ONLY IF DOCTOR IS ONLINE
    useEffect(() => {
    if (profile?.role !== 'doctor' || !user) return;

    const rtdb = getDatabase();
    const statusRef = ref(rtdb, `/status/${user.uid}`);
    
    // Listen for changes in the doctor's online status
    const unsubscribeStatus = onValue(statusRef, (statusSnap) => {
        const isOnline = statusSnap.exists() && statusSnap.val().state === 'online';
        if (isOnline) {
        // If online, listen for pending requests
        const q = query(collection(db, 'requests'), where('status', '==', 'pending'));
        const unsubscribeRequests = onSnapshot(q, (snapshot) => {
            const requests:Request[] = snapshot.docs.map(doc => 
                {const data = doc.data();
                  return {
                    userId: data.userId,
                    status: data.status,
                    createdAt: data.createdAt
                  };
                });
            setIncomingRequests(requests); // Timestamp will be null at first
        });
        // Stop requests listener when going offline
        return () => unsubscribeRequests();
        } else {
        setIncomingRequests([]); // clear if offline
        }
    });
    return () => unsubscribeStatus();
    }, [profile?.role, user]);


    // 6. LISTEN FETCH REQUEST STATUS FOR SET LOADING FOR PENDING REQUESTS
    useEffect(() => {
    if (!user || chat || profile?.role !== 'user') {
        setHasPendingRequest(false);
        return;
    }
    const reqRef = doc(db, 'requests', user.uid);
    const unsubscribeRequests = onSnapshot(reqRef, (snap) => {
        if (snap.exists() && snap.data().status === 'pending') {
        setHasPendingRequest(true);
        } else {
        setHasPendingRequest(false);
        }
    });
    return () => unsubscribeRequests();
    }, [chat, profile?.role, user]);



    const chatRequest = async () => {
        if (!user) return;
        const requestId = user.uid;
        const requestData = {
            userId: user.uid,
            status: 'pending',
            createdAt: serverTimestamp()
        };
        await setDoc(doc(db, 'requests', requestId), requestData);
        setHasPendingRequest(true); // <-- set flag
    };

    //requestId is id of user sending request
    const acceptRequest = async (requestId: string) => {
        if (!user) return;
        const chatRef = await addDoc(collection(db, 'chats'),{
            //requestId is user and user.uid is doctor
            userId: requestId, 
            doctorId: user.uid,
            createdAt: serverTimestamp(),
        });
        // const chatDoc = await getDoc(chatRef)
        // if (chatDoc.exists()){
        //     const data = chatDoc.data();
            //DO NOT SET CHAT, THE LISTENER ALR DOES IT FOR U WHEN PROFILE.CHATID CHANGE
            // setChat({
            //     id: chatRef.id,
            //     userId: data.userId,
            //     doctorId: data.doctorId,
            //     createdAt: data.createdAt.toDate()
            // })
            const updates = [];
            // delete user request and update chatId in both profiles
            updates.push(updateDoc(doc(db,'users', user.uid),{chatId: chatRef.id}));
            updates.push(updateDoc(doc(db,'users', requestId),{chatId: chatRef.id}));
            updates.push(deleteDoc(doc(db,'requests', requestId)))
            // DELETE bcos u cant have multiple requests with same id
            await Promise.all(updates);
        }
        // User profile is fetched above when chatId changes

    const handleSend = async () => {
        if (input.trim() === '') return;
        if (!chat || !chat?.id || !user) return;

        const index = chat.messages?.length ?? 0
        await addDoc(collection(db, 'chats', chat.id, 'messages'), {
            id: index,
            text: input,
            senderId: user.uid,
            timestamp: serverTimestamp(),
            });
        // No need setchat.messages, onSnapshot will update the messages state automatically
        setInput('');
    };

    //only add endedBy to chat doc and setChat
    const endBy = async () => {
        if (!chat || !user) return;
        // delete chatId from both profiles, dont delete chat log
        // add deleted by who in chat log
        // request alr deleted in acceptRequest
        if (chat.id && user.uid) {
            await updateDoc(doc(db,'chats',chat.id), {
                endedBy: {
                    user: user.uid,
                    endedAt: serverTimestamp()
                    //TIMESTAMP IS NOT IMMEDIATELY AVAILABLE, 1ST SNAPSHOT WILL HAVE
                    //endedAt AS MISSING/NULL BCOS FIRESTORE HAS NOT RESOLVED IT TO
                    //A TIMESTAMP YET
                }
            })
        }
    }
    //Officially end chat by removing profile.chatid, listener stops and setChat(null)
    //remove chatids from profiles, keep chat in db
    const endChat = async () => {
        if (!chat || !user) return;
        if (chat.userId && chat.doctorId){
            if (user.uid===chat.userId) {
                // when u change profile.chatId, CHAT listener stops.
                // SO u have to add endedBy first, otherwise listener wont catch it
                // I THINK
                // ALSO ONLY UPDATE OWN USERS DOC, SO CHATID ONLY GOES AWAY ONCE
                // U OWNSELF PRESS DIALOG BUTTON
                // LISTENER WILL STILL BE ACTIVE FOR DIALOG TO SHOW AS LONG AS U
                // HAVENT CLOSE DIALOG
                await updateDoc(doc(db, 'users', chat.userId), { chatId: null });
            }
            if (user.uid===chat.doctorId) {
                await updateDoc(doc(db, 'users', chat.doctorId), { chatId: null});
            }
        }
        setChat(null)
        // listener will update setChat:endedBy
        // Snackbar popup will setChat null onClose
        }

    return (
    <Card>
        <CardContent>
            {/* USER FIND DOCTOR BUTTON */}
            {!chat && profile?.role==='user' && 
            <Button 
            variant='contained' 
            onClick={chatRequest}
            sx={{ p:1.5}}
            disabled={hasPendingRequest}>
            Find Doctor
            </Button>
            }

            {/* LOADING MESSAGE FOR PENDING REQUEST */}
            {!chat && profile?.role === 'user' && hasPendingRequest && (
            <Box mt={3} textAlign="center">
                <CircularProgress  size={32} sx={{ mb: 2 }}/>
                <Typography variant="h6" gutterBottom>
                Please wait patiently
                </Typography>
                <Typography variant="body1" color="text.secondary">
                One of our doctors will assist you shortly.
                </Typography>
            </Box>
            )}

            
            {/* INCOMING REQUESTS */}
            {!chat && profile?.role==='doctor' &&
            <Typography variant='h6' color='primary' sx={{fontWeight:'bold'}}>
                Incoming requests
            </Typography>}
        
            {!chat && profile?.role === 'doctor' && incomingRequests.length > 0 && (
                <Box mt={2}>
                    {incomingRequests.map((request) => (
                    <Paper elevation={3} key={request.userId} sx={{ p: 2, mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                        <Typography><strong>User ID:</strong> {request.userId}</Typography>
                        <Typography variant="caption" color="text.secondary">
                            {request.createdAt.toDate().toLocaleString('en-SG', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                                })}
                        </Typography>
                        </Box>
                        <Button 
                        variant="contained" 
                        onClick={() => acceptRequest(request.userId)}
                        >
                        Accept
                        </Button>
                    </Paper>
                    ))}
                </Box>
                )}


            {chat &&
            <Box display="flex" flexDirection="column" height="80vh" p={2}>
                {/* Chat messages area */}
                <Box flexGrow={1} overflow="auto" mb={2}>
                    <Box mb={3}>
                    {chat.userId===user?.uid ? <Typography>User {chat.doctorId}</Typography>
                        :<Typography>User {chat.userId}</Typography>}
                    </Box>
                    {/* react wont render anything for this if chat.messages = null/undefined */}
                    {chat.messages?.map((msg) => (
                    <Box
                        //id = index in message array
                        key={msg.id}
                        display="flex"
                        justifyContent={msg.senderId === user?.uid ? 'flex-end' : 'flex-start'}
                        mb={0.5}
                        mr={2}
                    >
                        <Paper
                        elevation={2}
                        sx={{
                            p: 1.5,
                            maxWidth: '70%',
                            bgcolor: msg.senderId === user?.uid ? 'primary.main' : 'background.default',
                            color: msg.senderId === user?.uid ? 'white' : 'text.primary',
                        }}
                        >
                        <Typography variant="body1">{msg.text}</Typography>
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.7 }}>
                            {msg.timestamp?
                                (msg.timestamp.toDate().toLocaleTimeString(['en-SG'], { hour: '2-digit', minute: '2-digit' }))
                                :('Just now')}
                        </Typography>
                        </Paper>
                    </Box>
                    ))}
                    <div ref={bottomRef} />
                </Box>
                {/* Input box */}
                <Box display="flex" alignItems="center">
                    <TextField
                    fullWidth
                    variant="outlined"
                    size="medium"
                    placeholder="Type a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <IconButton onClick={handleSend} color="primary" sx={{ ml: 1 }}>
                    <SendIcon />
                    </IconButton>
                </Box>
                <Button 
                variant='contained' 
                sx={{mt:3, p:2, borderRadius: 2}}
                onClick={endBy}>
                End Chat
                </Button>
            </Box>
            }
            {chat &&
                <Dialog
                    open={Boolean(chat.endedBy?.user && chat.endedBy?.endedAt)}
                    onClose={endChat}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>Chat Ended</DialogTitle>
                    <DialogContent>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            <strong>{chat.endedBy?.user==user?.uid? 'You' : 'User ' + chat.endedBy?.user}</strong> ended the chat.
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Ended at{" "}
                            {chat.endedBy?.endedAt?
                            (chat.endedBy.endedAt.toDate().toLocaleString("en-SG", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                            })):('Just now')}
                        </Typography>
                    </DialogContent>
                    {/* DialogActions has display flex, justify-content flex end by default */}
                    <DialogActions> 
                        <Button onClick={endChat} variant="contained" color="primary">
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>}   
        </CardContent>
    </Card>
    )
}