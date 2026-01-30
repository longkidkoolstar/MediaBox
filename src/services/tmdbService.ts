// TMDB API configuration
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || '1d21d96347d1b72f32806b6256c3a132';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// Cache expiration time (24 hours in milliseconds)
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

// In-memory cache as a fallback for when localStorage is full
const memoryCache = new Map<string, { result: any; timestamp: number; notFound?: boolean }>();

/**
 * Get cached data from localStorage or memory cache
 */
const getCachedData = (cacheKey: string) => {
  try {
    // Try localStorage first
    const cached = localStorage.getItem(`tmdb_${cacheKey}`);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.warn('Error reading from localStorage:', error);
  }
  
  // Fallback to memory cache
  return memoryCache.get(cacheKey);
};

/**
 * Set cached data in localStorage and memory cache
 */
const setCachedData = (cacheKey: string, data: any) => {
  try {
    // Store in localStorage
    localStorage.setItem(`tmdb_${cacheKey}`, JSON.stringify(data));
  } catch (error) {
    // If localStorage is full, clear old entries
    if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
      console.warn('localStorage quota exceeded, clearing old TMDB cache entries');
      clearOldCacheEntries();
      try {
        localStorage.setItem(`tmdb_${cacheKey}`, JSON.stringify(data));
      } catch (retryError) {
        console.warn('Still unable to cache in localStorage, using memory cache only');
      }
    }
  }
  
  // Always store in memory cache as backup
  memoryCache.set(cacheKey, data);
};

/**
 * Clear old cache entries from localStorage
 */
const clearOldCacheEntries = () => {
  try {
    const now = Date.now();
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('tmdb_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.timestamp && now - data.timestamp > CACHE_EXPIRATION) {
            keysToRemove.push(key);
          }
        } catch (e) {
          // Invalid data, remove it
          keysToRemove.push(key);
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`Cleared ${keysToRemove.length} old cache entries`);
  } catch (error) {
    console.warn('Error clearing old cache entries:', error);
  }
};

/**
 * Fetch data from TMDB API with localStorage caching
 */
const fetchWithCache = async (endpoint: string, params: Record<string, string> = {}) => {
  try {
    // Create a unique cache key based on the endpoint and params
    const queryParams = new URLSearchParams({
      api_key: TMDB_API_KEY,
      ...params
    }).toString();

    const cacheKey = `${endpoint}?${queryParams}`.replace(/\//g, '_');
    const cachedData = getCachedData(cacheKey);

    // Check if we have valid cached data
    if (cachedData) {
      const now = Date.now();

      // Return cached data if it's still valid
      if (cachedData.timestamp && now - cachedData.timestamp < CACHE_EXPIRATION) {
        // If we previously cached a 404 error, return null
        if (cachedData.notFound) {
          return null;
        }
        return cachedData.result;
      }
    }

    // Fetch fresh data from TMDB API
    const url = `${TMDB_BASE_URL}${endpoint}?${queryParams}`;
    const response = await fetch(url);

    // Handle 404 errors specially
    if (response.status === 404) {
      // Cache the 404 result to avoid repeated requests for non-existent resources
      setCachedData(cacheKey, {
        notFound: true,
        timestamp: Date.now()
      });
      return null;
    }

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    // Cache the result in localStorage
    setCachedData(cacheKey, {
      result,
      timestamp: Date.now()
    });

    return result;
  } catch (error) {
    console.error('Error fetching from TMDB:', error);
    // Don't throw the error, just return null
    return null;
  }
};

/**
 * Get external IDs for a movie or TV show (including IMDb ID)
 */
export const getExternalIds = async (id: string, mediaType: 'movie' | 'tv') => {
  try {
    return await fetchWithCache(`/${mediaType}/${id}/external_ids`);
  } catch (error) {
    console.error(`Error getting external IDs for ${mediaType} ${id}:`, error);
    throw error;
  }
};

/**
 * Convert TMDB ID to IMDb ID
 */
export const convertToImdbId = async (tmdbId: string, mediaType: 'movie' | 'tv'): Promise<string> => {
  try {
    const data = await getExternalIds(tmdbId, mediaType);
    return data.imdb_id || '';
  } catch (error) {
    console.error('Error converting TMDB ID to IMDb ID:', error);
    throw error;
  }
};

/**
 * Get trending movies
 */
export const getTrendingMovies = async (page: number = 1) => {
  return fetchWithCache('/trending/movie/week', { page: page.toString() });
};

/**
 * Get trending TV shows
 */
export const getTrendingTVShows = async (page: number = 1) => {
  return fetchWithCache('/trending/tv/week', { page: page.toString() });
};

/**
 * Get popular anime (using TV shows with anime keyword)
 */
export const getPopularAnime = async (page: number = 1) => {
  // Anime keyword ID in TMDB is 210024
  return fetchWithCache('/discover/tv', {
    with_keywords: '210024',
    sort_by: 'popularity.desc',
    page: page.toString()
  });
};

/**
 * Get movie details
 */
export const getMovieDetails = async (movieId: string) => {
  return fetchWithCache(`/movie/${movieId}`, {
    append_to_response: 'videos,credits,similar,recommendations'
  });
};

/**
 * Get TV show details
 */
export const getTVShowDetails = async (tvId: string) => {
  return fetchWithCache(`/tv/${tvId}`, {
    append_to_response: 'videos,credits,similar,recommendations,external_ids'
  });
};

/**
 * Get TV season details
 */
export const getTVSeasonDetails = async (tvId: string, seasonNumber: number) => {
  return fetchWithCache(`/tv/${tvId}/season/${seasonNumber}`);
};

/**
 * Get TV episode details
 */
export const getTVEpisodeDetails = async (tvId: string, seasonNumber: number, episodeNumber: number) => {
  return fetchWithCache(`/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`);
};

/**
 * Get person (actor/director) details
 */
export const getPersonDetails = async (personId: string) => {
  return fetchWithCache(`/person/${personId}`, {
    append_to_response: 'combined_credits'
  });
};

/**
 * Search movies, TV shows, and people
 */
export const searchMulti = async (query: string, page: number = 1) => {
  return fetchWithCache('/search/multi', {
    query,
    page: page.toString(),
    include_adult: 'false'
  });
};

/**
 * Get movie genres
 */
export const getMovieGenres = async () => {
  return fetchWithCache('/genre/movie/list');
};

/**
 * Get TV genres
 */
export const getTVGenres = async () => {
  return fetchWithCache('/genre/tv/list');
};

/**
 * Discover movies by filters
 */
export const discoverMovies = async (params: Record<string, string>) => {
  return fetchWithCache('/discover/movie', params);
};

/**
 * Discover TV shows by filters
 */
export const discoverTVShows = async (params: Record<string, string>) => {
  return fetchWithCache('/discover/tv', params);
};

/**
 * Get image URL from TMDB
 */
export const getImageUrl = (path: string, size: string = 'original') => {
  if (!path) return '';
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};

/**
 * Get media details by ID and media type
 */
export const getMediaDetails = async (mediaId: number, mediaType: string) => {
  if (mediaType === 'movie') {
    return getMovieDetails(mediaId.toString());
  } else if (mediaType === 'tv' || mediaType === 'anime') {
    return getTVShowDetails(mediaId.toString());
  }
  throw new Error(`Unsupported media type: ${mediaType}`);
};

/**
 * Get multiple media items by IDs and media types
 */
export const getMultipleMediaDetails = async (mediaItems: { id: number; media_type: 'movie' | 'tv' | 'anime' }[]) => {
  if (!mediaItems || mediaItems.length === 0) {
    return [];
  }

  try {
    const results = await Promise.allSettled(
      mediaItems.map(async (item) => {
        try {
          const { id, media_type } = item;

          // Get details based on media type
          if (media_type === 'movie') {
            return getMovieDetails(id.toString())
              .then(data => ({
                ...data,
                media_type: 'movie',
                title: data.title || 'Unknown Title'
              }))
              .catch(() => null);
          } else {
            // For TV or anime
            return getTVShowDetails(id.toString())
              .then(data => ({
                ...data,
                media_type,
                title: data.name || data.title || 'Unknown Title'
              }))
              .catch(() => null);
          }
        } catch (err) {
          console.log(`Could not fetch details for media ID ${item.id} (${item.media_type}):`, err);
          return null;
        }
      })
    );

    // Filter out failed requests and extract values from fulfilled promises
    return results
      .filter(result => result.status === 'fulfilled' && result.value !== null)
      .map(result => (result as PromiseFulfilledResult<any>).value);
  } catch (error) {
    console.error('Error fetching multiple media details:', error);
    return [];
  }
};

/**
 * Legacy function to support old code that passes just an array of IDs
 * This tries to determine the media type by checking both movie and TV endpoints
 */
export const getMultipleMediaDetailsByIds = async (mediaIds: number[]) => {
  if (!mediaIds || mediaIds.length === 0) {
    return [];
  }

  try {
    const results = await Promise.allSettled(
      mediaIds.map(async (id) => {
        try {
          // Try as movie first
          const movieData = await getMovieDetails(id.toString())
            .then(data => ({
              ...data,
              media_type: 'movie',
              title: data.title || 'Unknown Title'
            }))
            .catch(() => null);

          if (movieData) return movieData;

          // If not a movie, try as TV show
          const tvData = await getTVShowDetails(id.toString())
            .then(data => ({
              ...data,
              media_type: 'tv',
              title: data.name || data.title || 'Unknown Title'
            }))
            .catch(() => null);

          return tvData;
        } catch (err) {
          console.log(`Could not fetch details for media ID ${id}:`, err);
          return null;
        }
      })
    );

    // Filter out failed requests and extract values from fulfilled promises
    return results
      .filter(result => result.status === 'fulfilled' && result.value !== null)
      .map(result => (result as PromiseFulfilledResult<any>).value);
  } catch (error) {
    console.error('Error fetching multiple media details:', error);
    return [];
  }
};

/**
 * Clear all TMDB cache (useful for debugging or forcing fresh data)
 */
export const clearCache = () => {
  try {
    // Clear localStorage cache
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('tmdb_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear memory cache
    memoryCache.clear();
    
    console.log(`Cleared ${keysToRemove.length} cache entries`);
  } catch (error) {
    console.warn('Error clearing cache:', error);
  }
};

export default {
  getTrendingMovies,
  getTrendingTVShows,
  getPopularAnime,
  getMovieDetails,
  getTVShowDetails,
  getTVSeasonDetails,
  getTVEpisodeDetails,
  getPersonDetails,
  searchMulti,
  getMovieGenres,
  getTVGenres,
  discoverMovies,
  discoverTVShows,
  getExternalIds,
  convertToImdbId,
  getImageUrl,
  getMediaDetails,
  getMultipleMediaDetails,
  getMultipleMediaDetailsByIds,
  clearCache
};
