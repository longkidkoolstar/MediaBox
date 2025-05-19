
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Layout } from "../components/Layout";
import { VideoPlayer } from "../components/VideoPlayer";
import { Loader2 } from "lucide-react";
import { useMovieDetails, useTVShowDetails } from "../hooks/useTMDB";
import { useVideoSources } from "../hooks/useVideoSources";
import { useWatchHistory } from "../hooks/useWatchHistory";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";

export function WatchPage() {
  const { mediaType, id } = useParams<{ mediaType: string; id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const seasonNumber = parseInt(queryParams.get("season") || "1");
  const episodeNumber = parseInt(queryParams.get("episode") || "1");

  const { userData } = useAuth();
  const { updateProgress } = useWatchHistory();

  // Fetch media details based on media type
  const { data: movieData, isLoading: movieLoading, error: movieError } =
    useMovieDetails(mediaType === "movie" ? id || "" : "");

  const { data: tvData, isLoading: tvLoading, error: tvError } =
    useTVShowDetails((mediaType === "tv" || mediaType === "anime") ? id || "" : "");

  // Get video sources
  const { sources, isLoading: sourcesLoading } = useVideoSources(
    mediaType as any,
    id || "",
    (mediaType === "tv" || mediaType === "anime") ? seasonNumber : undefined,
    (mediaType === "tv" || mediaType === "anime") ? episodeNumber : undefined
  );

  const isLoading = movieLoading || tvLoading || sourcesLoading;
  const error = movieError || tvError;
  const detail = mediaType === "movie" ? movieData : tvData;

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto">
          <div className="aspect-video bg-muted animate-pulse-slow flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
          <div className="p-4">
            <div className="h-8 bg-muted rounded-md w-1/3 animate-pulse-slow mb-4"></div>
            <div className="h-4 bg-muted rounded-md w-1/2 animate-pulse-slow"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !detail) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Content not found</h1>
          <p className="text-muted-foreground mb-6">
            {error ? `Error: ${error.message}` : "The requested content could not be found or is not available."}
          </p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </Layout>
    );
  }

  // Handle watch history update
  const handleProgressUpdate = (progress: number) => {
    if (!userData || !id) return;

    updateProgress({
      id: parseInt(id),
      title: detail.title,
      poster_path: detail.poster_path,
      media_type: mediaType || "movie",
      progress,
      lastWatched: new Date().toISOString(),
      ...(mediaType === "tv" || mediaType === "anime" ? { season: seasonNumber, episode: episodeNumber } : {})
    });
  };

  // For TV/Anime, check if we have episode data
  let title = detail.title;
  let nextEpisode;

  if (mediaType === "tv" || mediaType === "anime") {
    const currentSeason = detail.seasons?.find((s: any) => s.season_number === seasonNumber);
    if (currentSeason) {
      // Check if episodes array exists before trying to access it
      if (currentSeason.episodes && Array.isArray(currentSeason.episodes)) {
        const currentEpisode = currentSeason.episodes.find((e: any) => e.episode_number === episodeNumber);
        if (currentEpisode) {
          title = `${detail.title} - ${currentSeason.name}, Episode ${episodeNumber}: ${currentEpisode.name}`;
        }

        // Check for next episode
        const nextEpisodeInSeason = currentSeason.episodes.find((e: any) => e.episode_number === episodeNumber + 1);
        if (nextEpisodeInSeason) {
          nextEpisode = {
            id: nextEpisodeInSeason.id,
            seasonNumber,
            episodeNumber: episodeNumber + 1
          };
        }
      }

      // If no next episode in current season, check next season
      if (!nextEpisode && detail.seasons && detail.seasons.length > currentSeason.season_number) {
        const nextSeason = detail.seasons.find((s: any) => s.season_number === seasonNumber + 1);
        if (nextSeason && nextSeason.episodes && Array.isArray(nextSeason.episodes) && nextSeason.episodes.length > 0) {
          nextEpisode = {
            id: nextSeason.episodes[0].id,
            seasonNumber: seasonNumber + 1,
            episodeNumber: 1
          };
        }
      }
    }
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <VideoPlayer
          title={title}
          sources={sources}
          poster={`https://image.tmdb.org/t/p/w1280${detail.backdrop_path}`}
          mediaId={parseInt(id || "0")}
          mediaType={mediaType || ""}
          episodeNumber={episodeNumber}
          seasonNumber={seasonNumber}
          nextEpisode={nextEpisode}
          onProgressUpdate={handleProgressUpdate}
        />

        <div className="p-4 sm:p-6">
          <h1 className="text-xl sm:text-2xl font-bold mb-2">{title}</h1>
          <p className="text-sm text-muted-foreground mb-4">
            {mediaType === "movie" ? "Movie" : mediaType === "tv" ? "TV Show" : "Anime"}
            {seasonNumber && episodeNumber && ` • Season ${seasonNumber}, Episode ${episodeNumber}`}
          </p>

          <p className="text-muted-foreground">{detail.overview}</p>
        </div>
      </div>
    </Layout>
  );
}

export default WatchPage;
