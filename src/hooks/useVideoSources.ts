import { useState, useEffect, useCallback } from 'react';
import { useUserSettings } from './useUserSettings';
import videoSourceService, { VideoProvider } from '../services/videoSourceService';
import { VideoSource } from '../types/media';

export const useVideoSources = (
  mediaType: 'movie' | 'tv' | 'anime',
  mediaId: string,
  seasonNumber?: number,
  episodeNumber?: number
) => {
  const { settings } = useUserSettings();
  const [sources, setSources] = useState<VideoSource[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadSources = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const providers = videoSourceService.getAvailableProviders();
      const sourcePromises = providers.map(async (provider) => {
        try {
          let url = '';
          
          if (mediaType === 'movie') {
            url = await videoSourceService.getMovieEmbedUrl(mediaId, provider.id);
          } else {
            // For TV shows and anime
            url = await videoSourceService.getTVEmbedUrl(
              mediaId,
              provider.id,
              seasonNumber,
              episodeNumber
            );
          }
          
          return {
            name: provider.name,
            url
          };
        } catch (err) {
          console.error(`Error generating URL for ${provider.name}:`, err);
          return null;
        }
      });

      const results = await Promise.all(sourcePromises);
      const validSources = results.filter((source): source is VideoSource => source !== null);
      
      // Sort sources to put the default source first
      const sortedSources = [...validSources].sort((a, b) => {
        if (a.name.toLowerCase().includes(settings.defaultSource.toLowerCase())) return -1;
        if (b.name.toLowerCase().includes(settings.defaultSource.toLowerCase())) return 1;
        return 0;
      });
      
      setSources(sortedSources);
    } catch (err) {
      console.error('Error loading video sources:', err);
      setError('Failed to load video sources');
    } finally {
      setIsLoading(false);
    }
  }, [mediaType, mediaId, seasonNumber, episodeNumber, settings.defaultSource]);

  useEffect(() => {
    loadSources();
  }, [loadSources]);

  return {
    sources,
    isLoading,
    error,
    refreshSources: loadSources
  };
};
