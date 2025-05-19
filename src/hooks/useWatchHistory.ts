import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateWatchHistory, removeFromWatchHistory, clearWatchHistory } from '../services/userService';
import { WatchHistoryItem } from '../types/user';
import { toast } from 'sonner';

export const useWatchHistory = () => {
  const { userData, refreshUserData } = useAuth();
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const getWatchProgress = useCallback(
    (mediaId: number, mediaType: string, season?: number, episode?: number) => {
      if (!userData || !userData.watchHistory) return 0;

      const historyItem = userData.watchHistory.find(
        item =>
          item.id === mediaId &&
          item.media_type === mediaType &&
          (
            // For TV shows, match season and episode if provided
            mediaType !== 'movie'
              ? (season === undefined || item.season === season) &&
                (episode === undefined || item.episode === episode)
              : true
          )
      );

      return historyItem ? historyItem.progress : 0;
    },
    [userData]
  );

  const updateProgress = useCallback(
    async (historyItem: WatchHistoryItem) => {
      if (!userData) {
        // Don't show error for anonymous users
        return;
      }

      setIsProcessing(true);
      try {
        await updateWatchHistory(userData.id, historyItem);

        // Refresh user data to update the UI
        await refreshUserData();
      } catch (error) {
        console.error('Error updating watch progress:', error);
        toast.error('Failed to update watch progress');
      } finally {
        setIsProcessing(false);
      }
    },
    [userData, refreshUserData]
  );

  const removeHistory = useCallback(
    async (mediaId: number, mediaType: string, mediaTitle: string) => {
      if (!userData) {
        toast.error('You need to be logged in to manage watch history');
        return;
      }

      setIsProcessing(true);
      try {
        await removeFromWatchHistory(userData.id, mediaId, mediaType);
        toast.success(`Removed "${mediaTitle}" from watch history`);

        // Refresh user data to update the UI
        await refreshUserData();
      } catch (error) {
        console.error('Error removing from watch history:', error);
        toast.error('Failed to remove from watch history');
      } finally {
        setIsProcessing(false);
      }
    },
    [userData, refreshUserData]
  );

  const clearHistory = useCallback(
    async () => {
      if (!userData) {
        toast.error('You need to be logged in to manage watch history');
        return;
      }

      setIsProcessing(true);
      try {
        await clearWatchHistory(userData.id);
        toast.success('Watch history cleared successfully');

        // Refresh user data to update the UI
        await refreshUserData();
      } catch (error) {
        console.error('Error clearing watch history:', error);
        toast.error('Failed to clear watch history');
      } finally {
        setIsProcessing(false);
      }
    },
    [userData, refreshUserData]
  );

  return {
    watchHistory: userData?.watchHistory || [],
    getWatchProgress,
    updateProgress,
    removeHistory,
    clearHistory,
    isProcessing
  };
};
