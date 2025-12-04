
import React, { createContext, useContext, useCallback, useEffect, useRef } from 'react';
import useSWR, { mutate } from 'swr';

interface MatchRefreshContextType {
  refreshMatch: (matchId: string) => Promise<void>;
  isRefreshing: boolean;
}

const MatchRefreshContext = createContext<MatchRefreshContextType | undefined>(undefined);

export const useMatchRefresh = () => {
  const context = useContext(MatchRefreshContext);
  if (!context) {
    throw new Error('useMatchRefresh must be used within MatchRefreshProvider');
  }
  return context;
};

interface MatchRefreshProviderProps {
  children: React.ReactNode;
  inProgressMatchIds: string[];
}

export const MatchRefreshProvider: React.FC<MatchRefreshProviderProps> = ({ children, inProgressMatchIds }) => {
  const isRefreshingRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const refreshMatch = useCallback(async (matchId: string) => {
    if (isRefreshingRef.current) return;
    
    isRefreshingRef.current = true;
    try {
      await mutate(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}`);
    } finally {
      isRefreshingRef.current = false;
    }
  }, []);

  // Centralized auto-refresh for all in-progress matches
  useEffect(() => {
    if (inProgressMatchIds.length === 0) return;

    const refreshAllInProgress = async () => {
      if (isRefreshingRef.current) return;
      
      isRefreshingRef.current = true;
      try {
        await Promise.all(
          inProgressMatchIds.map(matchId =>
            mutate(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}`)
          )
        );
      } finally {
        isRefreshingRef.current = false;
      }
    };

    // Start interval for auto-refresh
    intervalRef.current = setInterval(refreshAllInProgress, 30000); // 30 seconds

    // Cleanup on unmount or when inProgressMatchIds changes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [inProgressMatchIds]);

  const value = {
    refreshMatch,
    isRefreshing: isRefreshingRef.current,
  };

  return (
    <MatchRefreshContext.Provider value={value}>
      {children}
    </MatchRefreshContext.Provider>
  );
};
