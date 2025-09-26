import { ref, onDisconnect, set, serverTimestamp } from "firebase/database";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { rtdb } from "@/lib/firebase";

export function usePresenceTracker() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const userStatusRef = ref(rtdb, `/status/${user.uid}`);

    const onlineStatus = {
      state: 'online',
      last_changed: serverTimestamp(),
    };

    const offlineStatus = {
      state: 'offline',
      last_changed: serverTimestamp(),
    };

    // Setup onDisconnect to run when disconnect happens in future
    onDisconnect(userStatusRef).set(offlineStatus).then(() => {
      // THEN u mark online
      set(userStatusRef, onlineStatus);
    });
  }, [user]);
}
