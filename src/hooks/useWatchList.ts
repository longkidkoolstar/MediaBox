import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateWatchStatus, removeFromWatchlist } from '../services/userService';
import { WatchStatus } from '../types/user';
import { toast } from 'sonner';

export const useWatchList = () => {
  const { userData, refreshUserData } = useAuth();
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const getWatchStatus = useCallback(
    (mediaId: number, mediaType: 'movie' | 'tv' | 'anime'): WatchStatus | null => {
      if (!userData) return null;
      
      // Check new watchlist first
      if (userData.watchlist) {
        const item = userData.watchlist.find(
          item => item.id === mediaId && item.media_type === mediaType
        );
        if (item) return item.status;
      }
      
      // Fallback to old watchLater (treat as plan_to_watch)
      if (userData.watchLater) {
        const inWatchLater = userData.watchLater.some(
          item => item.id === mediaId && item.media_type === mediaType
        );
        if (inWatchLater) return 'plan_to_watch';
      }
      
      return null;
    },
    [userData]
  );

  const updateStatus = useCallback(
    async (mediaId: number, mediaTitle: string, mediaType: 'movie' | 'tv' | 'anime', status: WatchStatus) => {
      if (!userData) {
        toast.error('You need to be logged in to manage your watchlist');
        return;
      }

      setIsProcessing(true);
      try {
        await updateWatchStatus(userData.id, mediaId, mediaType, status);
        toast.success(`Updated "${mediaTitle}" to ${status.replace(/_/g, ' ')}`);
        
        // Refresh user data to update the UI
        await refreshUserData();
      } catch (error) {
        console.error('Error updating watchlist:', error);
        toast.error('Failed to update watchlist');
      } finally {
        setIsProcessing(false);
      }
    },
    [userData, refreshUserData]
  );

  const removeItem = useCallback(
    async (mediaId: number, mediaTitle: string, mediaType: 'movie' | 'tv' | 'anime') => {
      if (!userData) {
        toast.error('You need to be logged in to manage your watchlist');
        return;
      }

      setIsProcessing(true);
      try {
        await removeFromWatchlist(userData.id, mediaId, mediaType);
        toast.success(`Removed "${mediaTitle}" from watchlist`);

        // Refresh user data to update the UI
        await refreshUserData();
      } catch (error) {
        console.error('Error removing from watchlist:', error);
        toast.error('Failed to remove from watchlist');
      } finally {
        setIsProcessing(false);
      }
    },
    [userData, refreshUserData]
  );

  // Combine old and new list for display
  const watchlistItems = userData?.watchlist || [];
  
  // Create a derived list that includes legacy items as 'plan_to_watch'
  const mergedWatchlist = [...watchlistItems];
  if (userData?.watchLater) {
    userData.watchLater.forEach(legacyItem => {
      const exists = mergedWatchlist.some(
        item => item.id === legacyItem.id && item.media_type === legacyItem.media_type
      );
      if (!exists) {
        mergedWatchlist.push({
          ...legacyItem,
          status: 'plan_to_watch',
          updatedAt: new Date().toISOString() // approximation
        });
      }
    });
  }

  return {
    watchlist: mergedWatchlist,
    getWatchStatus,
    updateStatus,
    removeItem,
    isProcessing
  };
};
