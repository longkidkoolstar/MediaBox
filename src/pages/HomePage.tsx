
import { useState, useEffect } from "react";
import { Layout } from "../components/Layout";
import { HeroSection } from "../components/HeroSection";
import { MediaCarousel } from "../components/MediaCarousel";
import { RecommendationsSection } from "../components/RecommendationsSection";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { useTrendingMovies, useTrendingTVShows, usePopularAnime } from "../hooks/useTMDB";

export function HomePage() {
  const { isAuthenticated } = useAuth();

  // Fetch real data from TMDB API
  const { data: trendingMovies, isLoading: moviesLoading } = useTrendingMovies();
  const { data: trendingTVShows, isLoading: tvLoading } = useTrendingTVShows();
  const { data: trendingAnime, isLoading: animeLoading } = usePopularAnime();

  const isLoaded = !moviesLoading && !tvLoading && !animeLoading &&
                  trendingMovies?.results && trendingTVShows?.results && trendingAnime?.results;

  // Show welcome toast when data is loaded
  useEffect(() => {
    if (isLoaded) {
      toast.success("Welcome to MediaBox!");
    }
  }, [isLoaded]);

  // Create hero items from the first item of each category
  const heroItems = isLoaded ? [
    {
      id: trendingMovies.results[0].id,
      title: trendingMovies.results[0].title,
      backdrop_path: trendingMovies.results[0].backdrop_path,
      overview: trendingMovies.results[0].overview,
      media_type: 'movie',
      release_date: trendingMovies.results[0].release_date
    },
    {
      id: trendingTVShows.results[0].id,
      title: trendingTVShows.results[0].name,
      backdrop_path: trendingTVShows.results[0].backdrop_path,
      overview: trendingTVShows.results[0].overview,
      media_type: 'tv',
      first_air_date: trendingTVShows.results[0].first_air_date
    },
    {
      id: trendingAnime.results[0].id,
      title: trendingAnime.results[0].name,
      backdrop_path: trendingAnime.results[0].backdrop_path,
      overview: trendingAnime.results[0].overview,
      media_type: 'anime',
      first_air_date: trendingAnime.results[0].first_air_date
    }
  ] : [];

  return (
    <Layout>
      {/* Hero Banner */}
      {isLoaded && <HeroSection items={heroItems} />}

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoaded ? (
          <>
            <MediaCarousel
              title="Trending Movies"
              items={trendingMovies.results.map(movie => ({
                id: movie.id,
                title: movie.title,
                poster_path: movie.poster_path,
                backdrop_path: movie.backdrop_path,
                vote_average: movie.vote_average,
                media_type: "movie",
                release_date: movie.release_date,
                overview: movie.overview
              }))}
              seeAllLink="/movies"
            />

            <MediaCarousel
              title="Popular TV Shows"
              items={trendingTVShows.results.map(show => ({
                id: show.id,
                title: show.name,
                poster_path: show.poster_path,
                backdrop_path: show.backdrop_path,
                vote_average: show.vote_average,
                media_type: "tv",
                first_air_date: show.first_air_date,
                overview: show.overview
              }))}
              seeAllLink="/tv"
            />

            <MediaCarousel
              title="Featured Anime"
              items={trendingAnime.results.map(anime => ({
                id: anime.id,
                title: anime.name,
                poster_path: anime.poster_path,
                backdrop_path: anime.backdrop_path,
                vote_average: anime.vote_average,
                media_type: "anime",
                first_air_date: anime.first_air_date,
                overview: anime.overview
              }))}
              seeAllLink="/anime"
            />

            {/* Personalized Recommendations */}
            <RecommendationsSection />
          </>
        ) : (
          <div className="py-20">
            <div className="space-y-8">
              <div className="h-8 bg-muted rounded-md animate-pulse-slow"></div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-[2/3] bg-muted rounded-lg animate-pulse-slow"></div>
                ))}
              </div>

              <div className="h-8 bg-muted rounded-md animate-pulse-slow"></div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-[2/3] bg-muted rounded-lg animate-pulse-slow"></div>
                ))}
              </div>

              <div className="h-8 bg-muted rounded-md animate-pulse-slow"></div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-[2/3] bg-muted rounded-lg animate-pulse-slow"></div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default HomePage;
