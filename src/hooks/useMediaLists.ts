import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getMultipleMediaDetails } from '../services/tmdbService';
import { MediaItem } from '../types/media';
import { removeFromFavorites, removeFromWatchlist, removeFromWatchLater } from '../services/userService';

export const useMediaLists = () => {
  const { userData, refreshUserData } = useAuth();
  const [favoriteItems, setFavoriteItems] = useState<MediaItem[]>([]);
  const [watchlistItems, setWatchlistItems] = useState<MediaItem[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState<boolean>(false);
  const [isLoadingWatchlist, setIsLoadingWatchlist] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const attemptedCleanupIds = useRef<Set<string>>(new Set());
  const isCleaningUp = useRef<boolean>(false);
  const lastFetchTime = useRef<number>(0);
  const MIN_FETCH_INTERVAL = 2000; // Minimum 2 seconds between fetches

  // Memoize refreshUserData to prevent unnecessary re-renders
  const stableRefreshUserData = useCallback(refreshUserData, []);

  // Fetch favorite items
  useEffect(() => {
    const fetchFavorites = async () => {
      // Prevent fetching during cleanup or too frequently
      if (isCleaningUp.current) {
        return;
      }

      const now = Date.now();
      if (now - lastFetchTime.current < MIN_FETCH_INTERVAL) {
        return;
      }
      lastFetchTime.current = now;

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

        // Filter out items we already tried to clean up
        const itemsToCleanup = missingItems.filter(
          item => !attemptedCleanupIds.current.has(`${item.media_type}:${item.id}`)
        );

        if (itemsToCleanup.length > 0 && userData.id) {
          console.log(`Cleaning up ${itemsToCleanup.length} invalid favorite items`);
          isCleaningUp.current = true;
          // Clean up invalid items from user's favorites
          for (const item of itemsToCleanup) {
            attemptedCleanupIds.current.add(`${item.media_type}:${item.id}`);
            await removeFromFavorites(userData.id, item.id, item.media_type);
          }
          // Refresh user data after cleanup is complete
          await stableRefreshUserData();
          isCleaningUp.current = false;
        }

        setFavoriteItems(results as MediaItem[]);
      } catch (err) {
        console.error('Error fetching favorite items:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch favorite items'));
        isCleaningUp.current = false;
      } finally {
        setIsLoadingFavorites(false);
      }
    };

    fetchFavorites();
  }, [userData?.id, userData?.favorites?.length, stableRefreshUserData]);

  // Fetch watchlist items (merging new watchlist and old watchLater)
  useEffect(() => {
    const fetchWatchlist = async () => {
      // Prevent fetching during cleanup or too frequently
      if (isCleaningUp.current) {
        return;
      }

      const itemsToFetch: { id: number, media_type: 'movie' | 'tv' | 'anime' }[] = [];

      if (userData?.watchlist) {
        itemsToFetch.push(...userData.watchlist.map(i => ({ id: i.id, media_type: i.media_type })));
      }

      if (userData?.watchLater) {
        userData.watchLater.forEach(item => {
          if (!itemsToFetch.some(existing => existing.id === item.id && existing.media_type === item.media_type)) {
            itemsToFetch.push(item);
          }
        });
      }

      if (itemsToFetch.length === 0) {
        setWatchlistItems([]);
        return;
      }

      setIsLoadingWatchlist(true);
      setError(null);

      try {
        const results = await getMultipleMediaDetails(itemsToFetch);

        // Check if any items couldn't be found and clean them up
        const foundIds = results.map(item => item.id);

        // Cleanup logic is a bit complex with merged lists, skipping for now or handling carefully
        // Ideally we should check which list the missing item came from.
        // For simplicity, I'll skip auto-cleanup for now or implement it later if needed.

        setWatchlistItems(results as MediaItem[]);
      } catch (err) {
        console.error('Error fetching watchlist items:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch watchlist items'));
      } finally {
        setIsLoadingWatchlist(false);
      }
    };

    fetchWatchlist();
  }, [userData?.id, userData?.watchlist?.length, userData?.watchLater?.length]);

  return {
    favoriteItems,
    watchlistItems,
    watchLaterItems: watchlistItems, // Alias for backward compatibility
    isLoadingFavorites,
    isLoadingWatchlist,
    isLoadingWatchLater: isLoadingWatchlist, // Alias for backward compatibility
    error
  };
};
