import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  serverTimestamp 
} from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { User, WatchHistoryItem } from '../types/user';
import tmdbService from './tmdbService';

interface GenrePreference {
  id: number;
  name: string;
  count: number;
  weight: number;
}

interface RecommendationResult {
  id: number;
  title: string;
  poster_path: string;
  media_type: 'movie' | 'tv' | 'anime';
  score: number;
  reason: string;
}

/**
 * Generate recommendations for a user based on their watch history and favorites
 */
export const generateRecommendations = async (userId: string): Promise<RecommendationResult[]> => {
  try {
    // Get user data
    const userDoc = await getDoc(doc(firestore, 'users', userId));
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data() as User;
    const watchHistory = userData.watchHistory || [];
    const favorites = userData.favorites || [];
    
    // If user has no watch history or favorites, return trending content
    if (watchHistory.length === 0 && favorites.length === 0) {
      const trending = await tmdbService.getTrendingMovies();
      return trending.results.slice(0, 10).map((item: any) => ({
        id: item.id,
        title: item.title || item.name,
        poster_path: item.poster_path,
        media_type: item.media_type as 'movie' | 'tv' | 'anime',
        score: 1,
        reason: 'Trending now'
      }));
    }
    
    // Analyze watch history to determine genre preferences
    const genrePreferences = await analyzeGenrePreferences(watchHistory, favorites);
    
    // Get recommendations based on top genres
    const recommendations = await getRecommendationsByGenres(
      genrePreferences,
      watchHistory.map(item => item.id),
      favorites
    );
    
    // Store recommendations in Firestore
    await storeRecommendations(userId, recommendations);
    
    return recommendations;
  } catch (error) {
    console.error('Error generating recommendations:', error);
    throw error;
  }
};

/**
 * Analyze user's genre preferences based on watch history and favorites
 */
const analyzeGenrePreferences = async (
  watchHistory: WatchHistoryItem[],
  favorites: number[]
): Promise<GenrePreference[]> => {
  try {
    // Get all movie and TV genres
    const movieGenres = await tmdbService.getMovieGenres();
    const tvGenres = await tmdbService.getTVGenres();
    
    // Combine all genres
    const allGenres = [
      ...movieGenres.genres,
      ...tvGenres.genres
    ];
    
    // Initialize genre counts
    const genreCounts: Record<number, { name: string; count: number }> = {};
    
    // Process watch history
    for (const item of watchHistory) {
      let details;
      
      if (item.media_type === 'movie') {
        details = await tmdbService.getMovieDetails(item.id.toString());
      } else {
        details = await tmdbService.getTVShowDetails(item.id.toString());
      }
      
      // Count genres
      for (const genre of details.genres) {
        if (!genreCounts[genre.id]) {
          genreCounts[genre.id] = { name: genre.name, count: 0 };
        }
        
        // Weight recently watched items more heavily
        const daysAgo = Math.max(1, Math.floor(
          (Date.now() - new Date(item.lastWatched).getTime()) / (1000 * 60 * 60 * 24)
        ));
        
        // Add weight based on progress (completed items count more)
        const progressWeight = item.progress > 0.9 ? 2 : 1;
        
        // Add to count with time decay
        genreCounts[genre.id].count += (progressWeight * (1 / Math.log(daysAgo + 1)));
      }
    }
    
    // Process favorites (higher weight)
    for (const favoriteId of favorites) {
      // Determine if it's a movie or TV show
      let details;
      try {
        details = await tmdbService.getMovieDetails(favoriteId.toString());
      } catch {
        try {
          details = await tmdbService.getTVShowDetails(favoriteId.toString());
        } catch {
          continue; // Skip if we can't get details
        }
      }
      
      // Count genres with higher weight for favorites
      for (const genre of details.genres) {
        if (!genreCounts[genre.id]) {
          genreCounts[genre.id] = { name: genre.name, count: 0 };
        }
        
        // Favorites get a higher weight
        genreCounts[genre.id].count += 3;
      }
    }
    
    // Convert to array and sort by count
    const genrePreferences = Object.entries(genreCounts).map(([id, data]) => ({
      id: parseInt(id),
      name: data.name,
      count: data.count,
      weight: data.count / Math.max(1, watchHistory.length + favorites.length)
    }));
    
    // Sort by weight descending
    return genrePreferences.sort((a, b) => b.weight - a.weight);
  } catch (error) {
    console.error('Error analyzing genre preferences:', error);
    throw error;
  }
};

/**
 * Get recommendations based on genre preferences
 */
const getRecommendationsByGenres = async (
  genrePreferences: GenrePreference[],
  watchedIds: number[],
  favoriteIds: number[]
): Promise<RecommendationResult[]> => {
  try {
    const recommendations: RecommendationResult[] = [];
    const processedIds = new Set([...watchedIds, ...favoriteIds]);
    
    // Get top 3 genres
    const topGenres = genrePreferences.slice(0, 3);
    
    // Get recommendations for each top genre
    for (const genre of topGenres) {
      // Get movie recommendations
      const movieParams = {
        with_genres: genre.id.toString(),
        sort_by: 'popularity.desc',
        page: '1'
      };
      
      const movieResults = await tmdbService.discoverMovies(movieParams);
      
      // Get TV recommendations
      const tvParams = {
        with_genres: genre.id.toString(),
        sort_by: 'popularity.desc',
        page: '1'
      };
      
      const tvResults = await tmdbService.discoverTVShows(tvParams);
      
      // Process movie results
      for (const movie of movieResults.results) {
        if (!processedIds.has(movie.id)) {
          processedIds.add(movie.id);
          recommendations.push({
            id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path,
            media_type: 'movie',
            score: genre.weight * (movie.vote_average / 10),
            reason: `Because you like ${genre.name} movies`
          });
        }
      }
      
      // Process TV results
      for (const show of tvResults.results) {
        if (!processedIds.has(show.id)) {
          processedIds.add(show.id);
          
          // Determine if it's anime
          const isAnime = show.genres?.some((g: any) => 
            g.name.toLowerCase().includes('animation') || 
            g.name.toLowerCase().includes('anime')
          ) || false;
          
          recommendations.push({
            id: show.id,
            title: show.name,
            poster_path: show.poster_path,
            media_type: isAnime ? 'anime' : 'tv',
            score: genre.weight * (show.vote_average / 10),
            reason: `Because you like ${genre.name} ${isAnime ? 'anime' : 'shows'}`
          });
        }
      }
    }
    
    // Sort by score descending and limit to 20 recommendations
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
  } catch (error) {
    console.error('Error getting recommendations by genres:', error);
    throw error;
  }
};

/**
 * Store recommendations in Firestore
 */
const storeRecommendations = async (
  userId: string,
  recommendations: RecommendationResult[]
): Promise<void> => {
  try {
    await setDoc(doc(firestore, 'recommendations', userId), {
      userId,
      recommendations,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error storing recommendations:', error);
    throw error;
  }
};

/**
 * Get stored recommendations for a user
 */
export const getRecommendations = async (userId: string): Promise<RecommendationResult[]> => {
  try {
    const recDoc = await getDoc(doc(firestore, 'recommendations', userId));
    
    if (recDoc.exists()) {
      const data = recDoc.data();
      
      // Check if recommendations are fresh (less than 24 hours old)
      const createdAt = data.createdAt?.toDate() || new Date(0);
      const now = new Date();
      const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceCreation < 24) {
        return data.recommendations;
      }
    }
    
    // Generate new recommendations if none exist or they're stale
    return generateRecommendations(userId);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    throw error;
  }
};

export default {
  generateRecommendations,
  getRecommendations
};
