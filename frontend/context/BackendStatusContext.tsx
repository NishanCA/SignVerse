"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { BACKEND_URL } from "../lib/config";

export type BackendStatus = "idle" | "waking" | "online" | "offline";

interface BackendStatusContextType {
  status: BackendStatus;
}

const BackendStatusContext = createContext<BackendStatusContextType>({ status: "idle" });

export const useBackendStatus = () => useContext(BackendStatusContext);

export const BackendStatusProvider = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatusState] = useState<BackendStatus>("idle");
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const setStatus = useCallback((newStatus: BackendStatus) => {
    setStatusState((prev) => {
      if (prev !== newStatus) {
        if (newStatus === "online") {
            localStorage.setItem("backend_status", "online");
            localStorage.setItem("backend_last_seen", Date.now().toString());
        } else if (newStatus === "offline") {
            localStorage.setItem("backend_status", "offline");
        }
        return newStatus;
      }
      return prev;
    });
  }, []);

  const pingBackend = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(`${BACKEND_URL}/health`);
      if (res.ok) {
        return true;
      }
    } catch (e) {
      // Network error
    }
    return false;
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) return;
    
    heartbeatIntervalRef.current = setInterval(async () => {
      const isOnline = await pingBackend();
      if (!isOnline) {
        setStatus("offline");
        stopHeartbeat();
      } else {
        setStatus("online");
      }
    }, 4 * 60 * 1000); // 4 minutes
  }, [pingBackend, setStatus, stopHeartbeat]);

  const startRetrySchedule = useCallback(() => {
    let attempt = 0;
    const delays = [5000, 15000, 30000, 60000];

    const tryConnect = async () => {
      setStatus("waking");
      const isOnline = await pingBackend();
      if (isOnline) {
        setStatus("online");
        startHeartbeat();
      } else {
        if (attempt < delays.length) {
          retryTimeoutRef.current = setTimeout(tryConnect, delays[attempt]);
          attempt++;
        } else {
          setStatus("offline");
        }
      }
    };

    // Start the first retry after the first delay
    retryTimeoutRef.current = setTimeout(tryConnect, delays[0]);
    attempt++;
  }, [pingBackend, setStatus, startHeartbeat]);

  useEffect(() => {
    // Read from cache for UI responsiveness
    const cachedStatus = localStorage.getItem("backend_status");
    const lastSeen = localStorage.getItem("backend_last_seen");
    
    if (cachedStatus === "online" && lastSeen) {
      // We still check time because if it's too old, we shouldn't flash "online" before verification
      const timeSince = Date.now() - parseInt(lastSeen, 10);
      if (timeSince < 5 * 60 * 1000) {
        setStatus("online");
      } else {
        setStatus("waking");
      }
    } else {
      setStatus("waking");
    }

    let isMounted = true;

    // Always do an initial silent background ping
    const initialCheck = async () => {
      const isOnline = await pingBackend();
      if (!isMounted) return;

      if (isOnline) {
        setStatus("online");
        startHeartbeat();
      } else {
        startRetrySchedule();
      }
    };

    initialCheck();

    return () => {
      isMounted = false;
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, [pingBackend, setStatus, startHeartbeat, startRetrySchedule]);

  return (
    <BackendStatusContext.Provider value={{ status }}>
      {children}
    </BackendStatusContext.Provider>
  );
};
