import { convertToImdbId } from './tmdbService';

// Video source providers
export enum VideoProvider {
  VIDSRC_DEV = 'vidsrc.dev',
  EMBED_2 = '2embed',
  EMBED_2CC = '2embed.cc',
  VIDSRC_XYZ = 'vidsrc.xyz',
  VIDSRC_TO = 'vidsrc.to'
}

/**
 * Build URL for vidsrc.xyz (custom method as specified in requirements)
 */
const buildVidsrcXyzUrl = (
  mediaType: 'movie' | 'tv',
  id: string,
  season?: number,
  episode?: number
): string => {
  const baseUrl = 'https://vidsrc.xyz/embed';

  // For movies, use the format: https://vidsrc.xyz/embed/movie?tmdb={id}
  if (mediaType === 'movie') {
    return `${baseUrl}/movie?tmdb=${id}`;
  }
  // For TV shows, use different formats based on whether season/episode are provided
  else {
    // Format with season and episode: https://vidsrc.xyz/embed/tv?tmdb={id}&s={season}&e={episode}
    if (season && episode) {
      return `${baseUrl}/tv?tmdb=${id}&s=${season}&e=${episode}`;
    }
    // Format with only season: https://vidsrc.xyz/embed/tv?tmdb={id}&s={season}
    else if (season) {
      return `${baseUrl}/tv?tmdb=${id}&s=${season}`;
    }
    // Format with just the show ID: https://vidsrc.xyz/embed/tv?tmdb={id}
    else {
      return `${baseUrl}/tv?tmdb=${id}`;
    }
  }
};

/**
 * Generate embed URL for a movie
 */
export const getMovieEmbedUrl = async (
  movieId: string,
  provider: VideoProvider,
  useImdbId: boolean = false
): Promise<string> => {
  try {
    let id = movieId;

    // Convert TMDB ID to IMDb ID if needed
    if (useImdbId || provider === VideoProvider.EMBED_2 || provider === VideoProvider.VIDSRC_TO) {
      if (!movieId.startsWith('tt')) {
        id = await convertToImdbId(movieId, 'movie');
      }
    }

    // Generate URL based on provider
    switch (provider) {
      case VideoProvider.VIDSRC_DEV:
        return `https://vidsrc.dev/embed/movie/${movieId}`;

      case VideoProvider.EMBED_2:
        return `https://2embed.org/embed/movie/${id}`;

      case VideoProvider.EMBED_2CC:
        return `https://www.2embed.cc/embed/${movieId}`;

      case VideoProvider.VIDSRC_XYZ:
        return buildVidsrcXyzUrl('movie', movieId);

      case VideoProvider.VIDSRC_TO:
        return `https://vidsrc.to/embed/movie/${id}`;

      default:
        return `https://vidsrc.dev/embed/movie/${movieId}`;
    }
  } catch (error) {
    console.error('Error generating movie embed URL:', error);
    // Fallback to vidsrc.dev with TMDB ID
    return `https://vidsrc.dev/embed/movie/${movieId}`;
  }
};

/**
 * Generate embed URL for a TV show
 */
export const getTVEmbedUrl = async (
  showId: string,
  provider: VideoProvider,
  season?: number,
  episode?: number,
  useImdbId: boolean = false
): Promise<string> => {
  try {
    let id = showId;

    // Convert TMDB ID to IMDb ID if needed
    if (useImdbId || provider === VideoProvider.EMBED_2 || provider === VideoProvider.VIDSRC_TO) {
      if (!showId.startsWith('tt')) {
        id = await convertToImdbId(showId, 'tv');
      }
    }

    // Generate URL based on provider
    switch (provider) {
      case VideoProvider.VIDSRC_DEV:
        if (season && episode) {
          return `https://vidsrc.dev/embed/tv/${showId}/${season}/${episode}`;
        }
        return `https://vidsrc.dev/embed/tv/${showId}`;

      case VideoProvider.EMBED_2:
        if (season && episode) {
          return `https://2embed.org/embed/tv/${id}/${season}/${episode}`;
        } else if (season) {
          return `https://2embed.org/embed/tv/${id}/${season}`;
        }
        return `https://2embed.org/embed/tv/${id}`;

      case VideoProvider.EMBED_2CC:
        if (season && episode) {
          return `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}`;
        }
        return `https://www.2embed.cc/embedtvfull/${id}`;

      case VideoProvider.VIDSRC_XYZ:
        return buildVidsrcXyzUrl('tv', showId, season, episode);

      case VideoProvider.VIDSRC_TO:
        if (season && episode) {
          return `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`;
        } else if (season) {
          return `https://vidsrc.to/embed/tv/${id}/${season}`;
        }
        return `https://vidsrc.to/embed/tv/${id}.html`;

      default:
        if (season && episode) {
          return `https://vidsrc.dev/embed/tv/${showId}/${season}/${episode}`;
        }
        return `https://vidsrc.dev/embed/tv/${showId}`;
    }
  } catch (error) {
    console.error('Error generating TV embed URL:', error);
    // Fallback to vidsrc.dev with TMDB ID
    if (season && episode) {
      return `https://vidsrc.dev/embed/tv/${showId}/${season}/${episode}`;
    }
    return `https://vidsrc.dev/embed/tv/${showId}`;
  }
};

/**
 * Get all available providers
 */
export const getAvailableProviders = (): { id: VideoProvider; name: string }[] => {
  return [
    { id: VideoProvider.VIDSRC_DEV, name: 'VidSrc.dev' },
    { id: VideoProvider.EMBED_2, name: '2Embed' },
    { id: VideoProvider.EMBED_2CC, name: '2Embed.cc' },
    { id: VideoProvider.VIDSRC_XYZ, name: 'VidSrc.xyz' },
    { id: VideoProvider.VIDSRC_TO, name: 'VidSrc.to' }
  ];
};

export default {
  getMovieEmbedUrl,
  getTVEmbedUrl,
  getAvailableProviders
};
