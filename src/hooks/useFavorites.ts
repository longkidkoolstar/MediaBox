import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { addToFavorites, removeFromFavorites } from '../services/userService';
import { toast } from 'sonner';

export const useFavorites = () => {
  const { userData, refreshUserData } = useAuth();
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const isFavorite = useCallback(
    (mediaId: number, mediaType: 'movie' | 'tv' | 'anime') => {
      if (!userData || !userData.favorites) return false;
      return userData.favorites.some(
        item => item.id === mediaId && item.media_type === mediaType
      );
    },
    [userData]
  );

  const toggleFavorite = useCallback(
    async (mediaId: number, mediaTitle: string, mediaType: 'movie' | 'tv' | 'anime') => {
      if (!userData) {
        toast.error('You need to be logged in to add favorites');
        return;
      }

      setIsProcessing(true);
      try {
        const isCurrentlyFavorite = isFavorite(mediaId, mediaType);

        if (isCurrentlyFavorite) {
          await removeFromFavorites(userData.id, mediaId, mediaType);
          toast.success(`Removed "${mediaTitle}" from favorites`);
        } else {
          await addToFavorites(userData.id, mediaId, mediaType);
          toast.success(`Added "${mediaTitle}" to favorites`);
        }

        // Refresh user data to update the UI
        await refreshUserData();
      } catch (error) {
        console.error('Error toggling favorite:', error);
        toast.error('Failed to update favorites');
      } finally {
        setIsProcessing(false);
      }
    },
    [userData, isFavorite, refreshUserData]
  );

  return {
    isFavorite,
    toggleFavorite,
    isProcessing
  };
};
