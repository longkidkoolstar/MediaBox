import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import recommendationService from '../services/recommendationService';
import { toast } from 'sonner';
import { MediaItem } from '../types/media';
import { useQueryClient } from '@tanstack/react-query';

export const useRecommendations = () => {
  const { userData, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [recommendations, setRecommendations] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef<boolean>(false);

  const fetchRecommendations = useCallback(async () => {
    if (!isAuthenticated || !userData?.id) {
      setRecommendations([]);
      return;
    }

    // Prevent duplicate fetches
    if (hasFetched.current) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      hasFetched.current = true;
      const results = await recommendationService.getRecommendations(userData.id);

      // Convert to MediaItem format
      const mediaItems: MediaItem[] = results.map(rec => ({
        id: rec.id,
        title: rec.title,
        poster_path: rec.poster_path,
        media_type: rec.media_type,
        vote_average: rec.vote_average || 0, // Use vote_average from recommendation if available
        overview: rec.reason, // Use reason as overview
        release_date: '', // We don't have this from recommendations
        first_air_date: '', // We don't have this from recommendations
      }));

      setRecommendations(mediaItems);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setError('Failed to load recommendations');
      toast.error('Failed to load recommendations');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, userData?.id]);

  // Fetch recommendations only once when user is authenticated
  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // Function to manually refresh recommendations
  const refreshRecommendations = useCallback(async () => {
    if (!isAuthenticated || !userData) {
      toast.error('You need to be logged in to get recommendations');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use the dedicated refresh function
      const results = await recommendationService.refreshRecommendations(userData.id);

      // Convert to MediaItem format
      const mediaItems: MediaItem[] = results.map(rec => ({
        id: rec.id,
        title: rec.title,
        poster_path: rec.poster_path,
        media_type: rec.media_type,
        vote_average: rec.vote_average || 0,
        overview: rec.reason,
        release_date: '',
        first_air_date: '',
      }));

      setRecommendations(mediaItems);

      // Invalidate any related queries that might depend on recommendations
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });

      toast.success('Recommendations refreshed');
    } catch (error) {
      console.error('Error refreshing recommendations:', error);
      setError('Failed to refresh recommendations');
      toast.error('Failed to refresh recommendations');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, userData, queryClient]);

  return {
    recommendations,
    isLoading,
    error,
    refreshRecommendations
  };
};

export default useRecommendations;
