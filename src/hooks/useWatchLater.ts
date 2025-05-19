import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { addToWatchLater, removeFromWatchLater, clearWatchLater } from '../services/userService';
import { toast } from 'sonner';

export const useWatchLater = () => {
  const { userData, refreshUserData } = useAuth();
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const isInWatchLater = useCallback(
    (mediaId: number, mediaType: 'movie' | 'tv' | 'anime') => {
      if (!userData || !userData.watchLater) return false;
      return userData.watchLater.some(
        item => item.id === mediaId && item.media_type === mediaType
      );
    },
    [userData]
  );

  const toggleWatchLater = useCallback(
    async (mediaId: number, mediaTitle: string, mediaType: 'movie' | 'tv' | 'anime') => {
      if (!userData) {
        toast.error('You need to be logged in to use Watch Later');
        return;
      }

      setIsProcessing(true);
      try {
        const isCurrentlyInWatchLater = isInWatchLater(mediaId, mediaType);

        if (isCurrentlyInWatchLater) {
          await removeFromWatchLater(userData.id, mediaId, mediaType);
          toast.success(`Removed "${mediaTitle}" from Watch Later`);
        } else {
          await addToWatchLater(userData.id, mediaId, mediaType);
          toast.success(`Added "${mediaTitle}" to Watch Later`);
        }

        // Refresh user data to update the UI
        await refreshUserData();
      } catch (error) {
        console.error('Error toggling watch later:', error);
        toast.error('Failed to update Watch Later list');
      } finally {
        setIsProcessing(false);
      }
    },
    [userData, isInWatchLater, refreshUserData]
  );

  const clearAllWatchLater = useCallback(
    async () => {
      if (!userData) {
        toast.error('You need to be logged in to manage Watch Later');
        return;
      }

      setIsProcessing(true);
      try {
        await clearWatchLater(userData.id);
        toast.success('Watch Later list cleared successfully');

        // Refresh user data to update the UI
        await refreshUserData();
      } catch (error) {
        console.error('Error clearing watch later list:', error);
        toast.error('Failed to clear Watch Later list');
      } finally {
        setIsProcessing(false);
      }
    },
    [userData, refreshUserData]
  );

  return {
    watchLaterItems: userData?.watchLater || [],
    isInWatchLater,
    toggleWatchLater,
    clearAllWatchLater,
    isProcessing
  };
};
