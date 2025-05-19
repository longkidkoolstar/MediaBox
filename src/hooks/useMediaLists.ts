import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getMultipleMediaDetails } from '../services/tmdbService';
import { MediaItem } from '../types/media';
import { removeFromFavorites, removeFromWatchLater } from '../services/userService';

export const useMediaLists = () => {
  const { userData, refreshUserData } = useAuth();
  const [favoriteItems, setFavoriteItems] = useState<MediaItem[]>([]);
  const [watchLaterItems, setWatchLaterItems] = useState<MediaItem[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState<boolean>(false);
  const [isLoadingWatchLater, setIsLoadingWatchLater] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch favorite items
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!userData || !userData.favorites || userData.favorites.length === 0) {
        setFavoriteItems([]);
        return;
      }

      setIsLoadingFavorites(true);
      setError(null);

      try {
        const results = await getMultipleMediaDetails(userData.favorites);

        // Check if any items couldn't be found and clean them up
        const foundIds = results.map(item => item.id);
        const missingItems = userData.favorites.filter(
          item => !foundIds.includes(item.id)
        );

        if (missingItems.length > 0 && userData.id) {
          console.log(`Cleaning up ${missingItems.length} invalid favorite items`);
          // Clean up invalid items from user's favorites
          for (const item of missingItems) {
            await removeFromFavorites(userData.id, item.id, item.media_type);
          }
          // Refresh user data
          await refreshUserData();
        }

        setFavoriteItems(results as MediaItem[]);
      } catch (err) {
        console.error('Error fetching favorite items:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch favorite items'));
      } finally {
        setIsLoadingFavorites(false);
      }
    };

    fetchFavorites();
  }, [userData, refreshUserData]);

  // Fetch watch later items
  useEffect(() => {
    const fetchWatchLater = async () => {
      if (!userData || !userData.watchLater || userData.watchLater.length === 0) {
        setWatchLaterItems([]);
        return;
      }

      setIsLoadingWatchLater(true);
      setError(null);

      try {
        const results = await getMultipleMediaDetails(userData.watchLater);

        // Check if any items couldn't be found and clean them up
        const foundIds = results.map(item => item.id);
        const missingItems = userData.watchLater.filter(
          item => !foundIds.includes(item.id)
        );

        if (missingItems.length > 0 && userData.id) {
          console.log(`Cleaning up ${missingItems.length} invalid watch later items`);
          // Clean up invalid items from user's watch later list
          for (const item of missingItems) {
            await removeFromWatchLater(userData.id, item.id, item.media_type);
          }
          // Refresh user data
          await refreshUserData();
        }

        setWatchLaterItems(results as MediaItem[]);
      } catch (err) {
        console.error('Error fetching watch later items:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch watch later items'));
      } finally {
        setIsLoadingWatchLater(false);
      }
    };

    fetchWatchLater();
  }, [userData, refreshUserData]);

  return {
    favoriteItems,
    watchLaterItems,
    isLoadingFavorites,
    isLoadingWatchLater,
    error
  };
};
