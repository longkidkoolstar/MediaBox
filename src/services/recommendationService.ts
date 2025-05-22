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
import { User, WatchHistoryItem, FavoriteItem } from '../types/user';
import tmdbService from './tmdbService';

interface GenrePreference {
  id: number;
  name: string;
  count: number;
  weight: number;
}

interface ActorPreference {
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
  vote_average?: number;
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
      // Get a mix of trending movies, TV shows, and anime
      const [trendingMovies, trendingTV, trendingAnime] = await Promise.all([
        tmdbService.getTrendingMovies(),
        tmdbService.getTrendingTVShows(),
        tmdbService.getPopularAnime()
      ]);

      // Combine and shuffle results for variety
      const combined = [
        ...trendingMovies.results.slice(0, 5).map((item: any) => ({
          id: item.id,
          title: item.title || item.name,
          poster_path: item.poster_path,
          media_type: 'movie' as const,
          score: 1,
          reason: 'Trending movie',
          vote_average: item.vote_average
        })),
        ...trendingTV.results.slice(0, 5).map((item: any) => ({
          id: item.id,
          title: item.title || item.name,
          poster_path: item.poster_path,
          media_type: 'tv' as const,
          score: 1,
          reason: 'Trending TV show',
          vote_average: item.vote_average
        })),
        ...trendingAnime.results.slice(0, 5).map((item: any) => ({
          id: item.id,
          title: item.title || item.name,
          poster_path: item.poster_path,
          media_type: 'anime' as const,
          score: 1,
          reason: 'Popular anime',
          vote_average: item.vote_average
        }))
      ];

      // Shuffle the array for variety
      const shuffled = combined.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 15);
    }

    // Analyze user preferences
    const [genrePreferences, actorPreferences] = await Promise.all([
      analyzeGenrePreferences(watchHistory, favorites),
      analyzeActorPreferences(watchHistory, favorites)
    ]);

    // Get recommendations based on preferences
    const [genreRecommendations, actorRecommendations, similarContentRecommendations] = await Promise.all([
      getRecommendationsByGenres(genrePreferences, watchHistory.map(item => item.id), favorites),
      getRecommendationsByActors(actorPreferences, watchHistory.map(item => item.id), favorites),
      getSimilarContentRecommendations(watchHistory, favorites)
    ]);

    // Combine all recommendations
    let allRecommendations = [
      ...genreRecommendations,
      ...actorRecommendations,
      ...similarContentRecommendations
    ];

    // Remove duplicates
    const uniqueIds = new Set();
    allRecommendations = allRecommendations.filter(rec => {
      const key = `${rec.media_type}-${rec.id}`;
      if (uniqueIds.has(key)) return false;
      uniqueIds.add(key);
      return true;
    });

    // Sort by score and limit to 20 recommendations
    const finalRecommendations = allRecommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    // Store recommendations in Firestore
    await storeRecommendations(userId, finalRecommendations);

    return finalRecommendations;
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
  favorites: FavoriteItem[]
): Promise<GenrePreference[]> => {
  try {
    // Get all movie and TV genres
    const [movieGenres, tvGenres] = await Promise.all([
      tmdbService.getMovieGenres(),
      tmdbService.getTVGenres()
    ]);

    // Initialize genre counts
    const genreCounts: Record<number, { name: string; count: number }> = {};

    // Process watch history with batch processing to reduce API calls
    const watchHistoryDetails = await Promise.all(
      watchHistory.map(async (item) => {
        try {
          let details;
          if (item.media_type === 'movie') {
            details = await tmdbService.getMovieDetails(item.id.toString());
          } else {
            details = await tmdbService.getTVShowDetails(item.id.toString());
          }
          return { item, details };
        } catch (error) {
          console.error(`Error fetching details for ${item.media_type} ${item.id}:`, error);
          return null;
        }
      })
    );

    // Process valid watch history items
    for (const entry of watchHistoryDetails) {
      if (!entry) continue;

      const { item, details } = entry;

      // Count genres with weights
      for (const genre of details.genres || []) {
        if (!genreCounts[genre.id]) {
          genreCounts[genre.id] = { name: genre.name, count: 0 };
        }

        // Weight factors

        // 1. Recency: More recent items get higher weight
        const daysAgo = Math.max(1, Math.floor(
          (Date.now() - new Date(item.lastWatched).getTime()) / (1000 * 60 * 60 * 24)
        ));
        const recencyWeight = 1 / Math.log(daysAgo + 1);

        // 2. Completion: Completed items get higher weight
        const completionWeight = item.progress > 0.9 ? 2 :
                                item.progress > 0.7 ? 1.5 :
                                item.progress > 0.5 ? 1.2 : 1;

        // 3. Repeated viewing: Items watched multiple times get higher weight
        // This would require tracking watch count, which we don't have yet
        // For now, we'll use a placeholder weight of 1
        const repeatWeight = 1;

        // Calculate final weight and add to count
        const totalWeight = recencyWeight * completionWeight * repeatWeight;
        genreCounts[genre.id].count += totalWeight;
      }
    }

    // Process favorites with batch processing
    const favoriteDetails = await Promise.all(
      favorites.map(async (favorite) => {
        try {
          let details;
          if (favorite.media_type === 'movie') {
            details = await tmdbService.getMovieDetails(favorite.id.toString());
          } else {
            details = await tmdbService.getTVShowDetails(favorite.id.toString());
          }
          return { favorite, details };
        } catch (error) {
          console.error(`Error fetching details for ${favorite.media_type} ${favorite.id}:`, error);
          return null;
        }
      })
    );

    // Process valid favorites
    for (const entry of favoriteDetails) {
      if (!entry) continue;

      const { details } = entry;

      // Count genres with higher weight for favorites
      for (const genre of details.genres || []) {
        if (!genreCounts[genre.id]) {
          genreCounts[genre.id] = { name: genre.name, count: 0 };
        }

        // Favorites get a higher weight (3x)
        genreCounts[genre.id].count += 3;
      }
    }

    // Convert to array and calculate weights
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
  favorites: FavoriteItem[]
): Promise<RecommendationResult[]> => {
  try {
    const recommendations: RecommendationResult[] = [];
    const processedIds = new Set([...watchedIds, ...favorites.map(f => f.id)]);

    // Get top 5 genres for more variety
    const topGenres = genrePreferences.slice(0, 5);

    // Get recommendations for each top genre in parallel
    const genreRecommendations = await Promise.all(
      topGenres.map(async (genre) => {
        try {
          // Get movie and TV recommendations in parallel
          const [movieResults, tvResults] = await Promise.all([
            tmdbService.discoverMovies({
              with_genres: genre.id.toString(),
              sort_by: 'popularity.desc',
              page: '1',
              vote_average_gte: '6.0' // Only include well-rated content
            }),
            tmdbService.discoverTVShows({
              with_genres: genre.id.toString(),
              sort_by: 'popularity.desc',
              page: '1',
              vote_average_gte: '6.0' // Only include well-rated content
            })
          ]);

          const results: RecommendationResult[] = [];

          // Process movie results
          for (const movie of movieResults.results.slice(0, 5)) { // Limit to 5 per genre
            if (!processedIds.has(movie.id)) {
              processedIds.add(movie.id);
              results.push({
                id: movie.id,
                title: movie.title,
                poster_path: movie.poster_path,
                media_type: 'movie',
                score: genre.weight * (movie.vote_average / 10) * 1.2, // Boost score slightly
                reason: `Because you like ${genre.name} movies`,
                vote_average: movie.vote_average
              });
            }
          }

          // Process TV results
          for (const show of tvResults.results.slice(0, 5)) { // Limit to 5 per genre
            if (!processedIds.has(show.id)) {
              processedIds.add(show.id);

              // Determine if it's anime based on genres or keywords
              const isAnime = show.genres?.some((g: any) =>
                g.name?.toLowerCase().includes('animation') ||
                g.name?.toLowerCase().includes('anime')
              ) ||
              show.keywords?.results?.some((k: any) =>
                k.name?.toLowerCase().includes('anime') ||
                k.name?.toLowerCase().includes('japanese animation')
              ) ||
              show.origin_country?.includes('JP');

              results.push({
                id: show.id,
                title: show.name,
                poster_path: show.poster_path,
                media_type: isAnime ? 'anime' : 'tv',
                score: genre.weight * (show.vote_average / 10) * 1.2, // Boost score slightly
                reason: `Because you like ${genre.name} ${isAnime ? 'anime' : 'shows'}`,
                vote_average: show.vote_average
              });
            }
          }

          return results;
        } catch (error) {
          console.error(`Error getting recommendations for genre ${genre.name}:`, error);
          return [];
        }
      })
    );

    // Flatten the array of arrays
    return genreRecommendations.flat();
  } catch (error) {
    console.error('Error getting recommendations by genres:', error);
    throw error;
  }
};

/**
 * Analyze user's actor/cast preferences based on watch history and favorites
 */
const analyzeActorPreferences = async (
  watchHistory: WatchHistoryItem[],
  favorites: FavoriteItem[]
): Promise<ActorPreference[]> => {
  try {
    // Initialize actor counts
    const actorCounts: Record<number, { name: string; count: number }> = {};

    // Process watch history with batch processing to reduce API calls
    const watchHistoryDetails = await Promise.all(
      watchHistory.map(async (item) => {
        try {
          let details;
          if (item.media_type === 'movie') {
            details = await tmdbService.getMovieDetails(item.id.toString());
          } else {
            details = await tmdbService.getTVShowDetails(item.id.toString());
          }
          return { item, details };
        } catch (error) {
          console.error(`Error fetching details for ${item.media_type} ${item.id}:`, error);
          return null;
        }
      })
    );

    // Process valid watch history items
    for (const entry of watchHistoryDetails) {
      if (!entry || !entry.details.credits?.cast) continue;

      const { item, details } = entry;

      // Count actors with weights (only consider top 5 cast members)
      for (const actor of details.credits.cast.slice(0, 5)) {
        if (!actorCounts[actor.id]) {
          actorCounts[actor.id] = { name: actor.name, count: 0 };
        }

        // Weight factors similar to genre preferences
        const daysAgo = Math.max(1, Math.floor(
          (Date.now() - new Date(item.lastWatched).getTime()) / (1000 * 60 * 60 * 24)
        ));
        const recencyWeight = 1 / Math.log(daysAgo + 1);
        const completionWeight = item.progress > 0.9 ? 2 :
                                item.progress > 0.7 ? 1.5 :
                                item.progress > 0.5 ? 1.2 : 1;

        // Calculate final weight and add to count
        const totalWeight = recencyWeight * completionWeight;
        actorCounts[actor.id].count += totalWeight;
      }
    }

    // Process favorites with batch processing
    const favoriteDetails = await Promise.all(
      favorites.map(async (favorite) => {
        try {
          let details;
          if (favorite.media_type === 'movie') {
            details = await tmdbService.getMovieDetails(favorite.id.toString());
          } else {
            details = await tmdbService.getTVShowDetails(favorite.id.toString());
          }
          return { favorite, details };
        } catch (error) {
          console.error(`Error fetching details for ${favorite.media_type} ${favorite.id}:`, error);
          return null;
        }
      })
    );

    // Process valid favorites
    for (const entry of favoriteDetails) {
      if (!entry || !entry.details.credits?.cast) continue;

      const { details } = entry;

      // Count actors with higher weight for favorites (only consider top 5 cast members)
      for (const actor of details.credits.cast.slice(0, 5)) {
        if (!actorCounts[actor.id]) {
          actorCounts[actor.id] = { name: actor.name, count: 0 };
        }

        // Favorites get a higher weight (3x)
        actorCounts[actor.id].count += 3;
      }
    }

    // Convert to array and calculate weights
    const actorPreferences = Object.entries(actorCounts).map(([id, data]) => ({
      id: parseInt(id),
      name: data.name,
      count: data.count,
      weight: data.count / Math.max(1, watchHistory.length + favorites.length)
    }));

    // Sort by weight descending
    return actorPreferences.sort((a, b) => b.weight - a.weight);
  } catch (error) {
    console.error('Error analyzing actor preferences:', error);
    throw error;
  }
};

/**
 * Get recommendations based on actor preferences
 */
const getRecommendationsByActors = async (
  actorPreferences: ActorPreference[],
  watchedIds: number[],
  favorites: FavoriteItem[]
): Promise<RecommendationResult[]> => {
  try {
    const processedIds = new Set([...watchedIds, ...favorites.map(f => f.id)]);

    // Get top 5 actors
    const topActors = actorPreferences.slice(0, 5);

    // Get recommendations for each top actor in parallel
    const actorRecommendations = await Promise.all(
      topActors.map(async (actor) => {
        try {
          // Get movies and TV shows with this actor
          const personDetails = await tmdbService.getPersonDetails(actor.id.toString());

          if (!personDetails.combined_credits) {
            return [];
          }

          const results: RecommendationResult[] = [];

          // Process cast credits (limit to 5 per actor)
          const sortedCredits = personDetails.combined_credits.cast
            .filter((credit: any) =>
              (credit.media_type === 'movie' || credit.media_type === 'tv') &&
              credit.vote_average >= 6.0 &&
              !processedIds.has(credit.id)
            )
            .sort((a: any, b: any) => b.vote_average - a.vote_average || b.popularity - a.popularity)
            .slice(0, 5);

          for (const credit of sortedCredits) {
            processedIds.add(credit.id);

            // Determine if it's anime for TV shows
            const isAnime = credit.media_type === 'tv' && (
              credit.genres?.some((g: any) =>
                g.name?.toLowerCase().includes('animation') ||
                g.name?.toLowerCase().includes('anime')
              ) ||
              credit.origin_country?.includes('JP')
            );

            results.push({
              id: credit.id,
              title: credit.title || credit.name,
              poster_path: credit.poster_path,
              media_type: isAnime ? 'anime' : credit.media_type,
              score: actor.weight * (credit.vote_average / 10) * 1.1,
              reason: `Featuring ${actor.name}, who you like`,
              vote_average: credit.vote_average
            });
          }

          return results;
        } catch (error) {
          console.error(`Error getting recommendations for actor ${actor.name}:`, error);
          return [];
        }
      })
    );

    // Flatten the array of arrays
    return actorRecommendations.flat();
  } catch (error) {
    console.error('Error getting recommendations by actors:', error);
    throw error;
  }
};

/**
 * Get recommendations based on similar content to what the user has watched or favorited
 */
const getSimilarContentRecommendations = async (
  watchHistory: WatchHistoryItem[],
  favorites: FavoriteItem[]
): Promise<RecommendationResult[]> => {
  try {
    const processedIds = new Set([
      ...watchHistory.map(item => item.id),
      ...favorites.map(item => item.id)
    ]);

    // Get the most recent watch history items and all favorites
    const recentWatchHistory = [...watchHistory]
      .sort((a, b) => new Date(b.lastWatched).getTime() - new Date(a.lastWatched).getTime())
      .slice(0, 5);

    // Combine recent watch history and favorites, prioritizing items with high completion
    const priorityItems = [
      ...recentWatchHistory.filter(item => item.progress > 0.7),
      ...favorites.slice(0, 5)
    ].slice(0, 8); // Limit to 8 items to avoid too many API calls

    // Get similar content for each priority item
    const similarContentRecommendations = await Promise.all(
      priorityItems.map(async (item) => {
        try {
          let similar;
          const mediaType = 'media_type' in item ? item.media_type : item.media_type;

          if (mediaType === 'movie') {
            const details = await tmdbService.getMovieDetails(item.id.toString());
            similar = details.recommendations || details.similar || { results: [] };
          } else {
            const details = await tmdbService.getTVShowDetails(item.id.toString());
            similar = details.recommendations || details.similar || { results: [] };
          }

          const results: RecommendationResult[] = [];

          // Process similar content (limit to 3 per source item)
          for (const content of similar.results.slice(0, 3)) {
            if (processedIds.has(content.id)) continue;
            processedIds.add(content.id);

            // Determine if it's anime for TV shows
            const contentMediaType = content.media_type || mediaType;
            const isAnime = contentMediaType === 'tv' && (
              content.genres?.some((g: any) =>
                g.name?.toLowerCase().includes('animation') ||
                g.name?.toLowerCase().includes('anime')
              ) ||
              content.origin_country?.includes('JP')
            );

            results.push({
              id: content.id,
              title: content.title || content.name,
              poster_path: content.poster_path,
              media_type: isAnime ? 'anime' : contentMediaType,
              score: 0.9 * (content.vote_average / 10), // Slightly lower base score
              reason: `Similar to ${item.title} that you ${
                'progress' in item ? (item.progress > 0.9 ? 'watched' : 'started watching') : 'favorited'
              }`,
              vote_average: content.vote_average
            });
          }

          return results;
        } catch (error) {
          console.error(`Error getting similar content for ${item.id}:`, error);
          return [];
        }
      })
    );

    // Flatten the array of arrays
    return similarContentRecommendations.flat();
  } catch (error) {
    console.error('Error getting similar content recommendations:', error);
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

      if (hoursSinceCreation < 24 && data.recommendations && data.recommendations.length > 0) {
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

/**
 * Force refresh recommendations for a user
 */
export const refreshRecommendations = async (userId: string): Promise<RecommendationResult[]> => {
  try {
    // Generate new recommendations
    const recommendations = await generateRecommendations(userId);

    // Store in Firestore
    await storeRecommendations(userId, recommendations);

    return recommendations;
  } catch (error) {
    console.error('Error refreshing recommendations:', error);
    throw error;
  }
};

export default {
  generateRecommendations,
  getRecommendations,
  refreshRecommendations
};
