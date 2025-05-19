import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import recommendationService from '../services/recommendationService';
import { toast } from 'sonner';
import { MediaItem } from '../types/media';

export const useRecommendations = () => {
  const { userData, isAuthenticated } = useAuth();
  const [recommendations, setRecommendations] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    if (!isAuthenticated || !userData) {
      setRecommendations([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await recommendationService.getRecommendations(userData.id);
      
      // Convert to MediaItem format
      const mediaItems: MediaItem[] = results.map(rec => ({
        id: rec.id,
        title: rec.title,
        poster_path: rec.poster_path,
        media_type: rec.media_type,
        vote_average: 0, // We don't have this from recommendations
        overview: rec.reason, // Use reason as overview
        release_date: '', // We don't have this from recommendations
      }));
      
      setRecommendations(mediaItems);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setError('Failed to load recommendations');
      toast.error('Failed to load recommendations');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, userData]);

  // Fetch recommendations when user data changes
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
      // Force generate new recommendations
      const results = await recommendationService.generateRecommendations(userData.id);
      
      // Convert to MediaItem format
      const mediaItems: MediaItem[] = results.map(rec => ({
        id: rec.id,
        title: rec.title,
        poster_path: rec.poster_path,
        media_type: rec.media_type,
        vote_average: 0,
        overview: rec.reason,
        release_date: '',
      }));
      
      setRecommendations(mediaItems);
      toast.success('Recommendations refreshed');
    } catch (error) {
      console.error('Error refreshing recommendations:', error);
      setError('Failed to refresh recommendations');
      toast.error('Failed to refresh recommendations');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, userData]);

  return {
    recommendations,
    isLoading,
    error,
    refreshRecommendations
  };
};

export default useRecommendations;
