import { useQuery } from '@tanstack/react-query';
import tmdbService from '../services/tmdbService';
import { MediaItem, MovieDetails, TVShowDetails } from '../types/media';

// Hook for fetching trending movies
export const useTrendingMovies = (page: number = 1) => {
  return useQuery({
    queryKey: ['trendingMovies', page],
    queryFn: () => tmdbService.getTrendingMovies(page),
    select: (data) => ({
      results: data.results.map((movie: any) => ({
        ...movie,
        title: movie.title || movie.name,
        media_type: 'movie'
      })) as MediaItem[],
      total_pages: data.total_pages,
      total_results: data.total_results,
      page: data.page
    }),
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
};

// Hook for fetching trending TV shows
export const useTrendingTVShows = (page: number = 1) => {
  return useQuery({
    queryKey: ['trendingTVShows', page],
    queryFn: () => tmdbService.getTrendingTVShows(page),
    select: (data) => ({
      results: data.results.map((show: any) => ({
        ...show,
        title: show.name || show.title,
        media_type: 'tv'
      })) as MediaItem[],
      total_pages: data.total_pages,
      total_results: data.total_results,
      page: data.page
    }),
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
};

// Hook for fetching popular anime
export const usePopularAnime = (page: number = 1) => {
  return useQuery({
    queryKey: ['popularAnime', page],
    queryFn: () => tmdbService.getPopularAnime(page),
    select: (data) => ({
      results: data.results.map((anime: any) => ({
        ...anime,
        title: anime.name || anime.title,
        media_type: 'anime'
      })) as MediaItem[],
      total_pages: data.total_pages,
      total_results: data.total_results,
      page: data.page
    }),
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
};

// Hook for fetching movie details
export const useMovieDetails = (movieId: string) => {
  return useQuery({
    queryKey: ['movieDetails', movieId],
    queryFn: () => tmdbService.getMovieDetails(movieId),
    select: (data) => ({
      ...data,
      title: data.title,
      media_type: 'movie',
      genres: data.genres.map((genre: any) => genre.name)
    } as MovieDetails),
    staleTime: 1000 * 60 * 10, // 10 minutes
    enabled: !!movieId
  });
};

// Hook for fetching TV show details
export const useTVShowDetails = (tvId: string) => {
  return useQuery({
    queryKey: ['tvDetails', tvId],
    queryFn: () => tmdbService.getTVShowDetails(tvId),
    select: (data) => ({
      ...data,
      title: data.name,
      media_type: data.genres.some((genre: any) =>
        genre.name.toLowerCase().includes('animation') ||
        genre.name.toLowerCase().includes('anime')
      ) ? 'anime' : 'tv',
      genres: data.genres.map((genre: any) => genre.name)
    } as TVShowDetails),
    staleTime: 1000 * 60 * 10, // 10 minutes
    enabled: !!tvId
  });
};

// Hook for fetching TV season details
export const useTVSeasonDetails = (tvId: string, seasonNumber: number) => {
  return useQuery({
    queryKey: ['seasonDetails', tvId, seasonNumber],
    queryFn: () => tmdbService.getTVSeasonDetails(tvId, seasonNumber),
    staleTime: 1000 * 60 * 10, // 10 minutes
    enabled: !!tvId && seasonNumber > 0
  });
};

// Hook for fetching first season details for a TV show
export const useFirstSeasonDetails = (tvId: string, seasons: any[] | undefined) => {
  // Find the first season with episodes (usually season 1, but some shows start with season 0)
  const firstSeasonNumber = seasons && seasons.length > 0
    ? seasons.find(s => s.season_number > 0)?.season_number || 1
    : 1;

  return useQuery({
    queryKey: ['firstSeasonDetails', tvId, firstSeasonNumber],
    queryFn: () => tmdbService.getTVSeasonDetails(tvId, firstSeasonNumber),
    staleTime: 1000 * 60 * 10, // 10 minutes
    enabled: !!tvId && !!seasons && seasons.length > 0
  });
};

// Hook for fetching TV episode details
export const useTVEpisodeDetails = (tvId: string, seasonNumber: number, episodeNumber: number) => {
  return useQuery({
    queryKey: ['episodeDetails', tvId, seasonNumber, episodeNumber],
    queryFn: () => tmdbService.getTVEpisodeDetails(tvId, seasonNumber, episodeNumber),
    staleTime: 1000 * 60 * 10, // 10 minutes
    enabled: !!tvId && seasonNumber > 0 && episodeNumber > 0
  });
};

// Hook for searching media
export const useSearchMedia = (query: string, page: number = 1) => {
  return useQuery({
    queryKey: ['search', query, page],
    queryFn: () => tmdbService.searchMulti(query, page),
    select: (data) => ({
      results: data.results
        .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
        .map((item: any) => ({
          ...item,
          title: item.title || item.name,
          media_type: item.media_type
        })) as MediaItem[],
      total_pages: data.total_pages,
      total_results: data.total_results,
      page: data.page
    }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: query.length > 0
  });
};

// Hook for fetching movie genres
export const useMovieGenres = () => {
  return useQuery({
    queryKey: ['movieGenres'],
    queryFn: () => tmdbService.getMovieGenres(),
    select: (data) => data.genres,
    staleTime: 1000 * 60 * 60 * 24 // 24 hours
  });
};

// Hook for fetching TV genres
export const useTVGenres = () => {
  return useQuery({
    queryKey: ['tvGenres'],
    queryFn: () => tmdbService.getTVGenres(),
    select: (data) => data.genres,
    staleTime: 1000 * 60 * 60 * 24 // 24 hours
  });
};
