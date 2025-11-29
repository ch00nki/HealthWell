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
      last_changed: Date.now(),
    };

    const offlineStatus = {
      state: 'offline',
      last_changed: Date.now(),
    };

  // Set up onDisconnect first
  const disconnectPromise = onDisconnect(userStatusRef).set(offlineStatus);

  // Then mark user online
  disconnectPromise.then(() => {
    set(userStatusRef, onlineStatus);
  });

  // Cleanup when user logs out or component unmounts
  return () => {
    set(userStatusRef, offlineStatus);
  };
  }, [user]);
}

// ✅ New component version that wraps children and activates the hook
export function UserPresenceTracker({ children }: { children: React.ReactNode }) {
  usePresenceTracker();
  return <>{children}</>;
}