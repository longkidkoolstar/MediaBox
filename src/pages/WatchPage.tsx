
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Layout } from "../components/Layout";
import { VideoPlayer } from "../components/VideoPlayer";
import { Loader2 } from "lucide-react";
import { useMovieDetails, useTVShowDetails, useTVSeasonDetails } from "../hooks/useTMDB";
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

  // Fetch season details for TV shows
  const { data: seasonData, isLoading: seasonLoading } = useTVSeasonDetails(
    (mediaType === "tv" || mediaType === "anime") ? id || "" : "",
    (mediaType === "tv" || mediaType === "anime") ? seasonNumber : 0
  );

  // Get video sources
  const { sources, isLoading: sourcesLoading } = useVideoSources(
    mediaType as any,
    id || "",
    (mediaType === "tv" || mediaType === "anime") ? seasonNumber : undefined,
    (mediaType === "tv" || mediaType === "anime") ? episodeNumber : undefined
  );

  const isLoading = movieLoading || tvLoading || sourcesLoading || (mediaType !== "movie" && seasonLoading);
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
  let title = detail?.title || "";
  let nextEpisode;
  let prevEpisode;

  if ((mediaType === "tv" || mediaType === "anime") && detail && seasonData) {
    // Use the season name from the season data
    const seasonName = seasonData.name || `Season ${seasonNumber}`;

    // Find current episode
    if (seasonData.episodes && Array.isArray(seasonData.episodes)) {
      const currentEpisode = seasonData.episodes.find((e: any) => e.episode_number === episodeNumber);

      if (currentEpisode) {
        title = `${detail.title} - ${seasonName}, Episode ${episodeNumber}: ${currentEpisode.name}`;

        // Check for next episode in the same season
        const nextEpisodeIndex = seasonData.episodes.findIndex((e: any) => e.episode_number === episodeNumber + 1);
        if (nextEpisodeIndex !== -1) {
          const nextEpisodeData = seasonData.episodes[nextEpisodeIndex];
          nextEpisode = {
            id: nextEpisodeData.id,
            seasonNumber,
            episodeNumber: nextEpisodeData.episode_number
          };
          console.log("Found next episode:", nextEpisode);
        }

        // Check for previous episode in the same season
        const prevEpisodeIndex = seasonData.episodes.findIndex((e: any) => e.episode_number === episodeNumber - 1);
        if (prevEpisodeIndex !== -1) {
          const prevEpisodeData = seasonData.episodes[prevEpisodeIndex];
          prevEpisode = {
            id: prevEpisodeData.id,
            seasonNumber,
            episodeNumber: prevEpisodeData.episode_number
          };
          console.log("Found previous episode:", prevEpisode);
        }
      }
    }

    // If no next episode in current season, check if there's a next season
    if (!nextEpisode && detail.seasons) {
      // Sort seasons by season_number to ensure we get the correct next season
      const sortedSeasons = [...detail.seasons].sort((a, b) => a.season_number - b.season_number);
      const currentSeasonIndex = sortedSeasons.findIndex(s => s.season_number === seasonNumber);

      if (currentSeasonIndex !== -1 && currentSeasonIndex < sortedSeasons.length - 1) {
        const nextSeason = sortedSeasons[currentSeasonIndex + 1];
        if (nextSeason && nextSeason.season_number > 0) {
          // For next season, we'll just set episode 1 (we don't have the episode data yet)
          nextEpisode = {
            id: parseInt(id || "0"), // We don't have the episode ID, so use the show ID
            seasonNumber: nextSeason.season_number,
            episodeNumber: 1
          };
          console.log("Found next season:", nextEpisode);
        }
      }
    }

    // If no previous episode in current season, check if there's a previous season
    if (!prevEpisode && seasonNumber > 1 && detail.seasons) {
      // Sort seasons by season_number to ensure we get the correct previous season
      const sortedSeasons = [...detail.seasons].sort((a, b) => a.season_number - b.season_number);
      const currentSeasonIndex = sortedSeasons.findIndex(s => s.season_number === seasonNumber);

      if (currentSeasonIndex > 0) {
        const prevSeason = sortedSeasons[currentSeasonIndex - 1];
        if (prevSeason && prevSeason.season_number > 0) {
          // For previous season, we'll use the last episode (assuming it's the season finale)
          // We don't know the exact episode count, so we'll use a reasonable guess (10)
          prevEpisode = {
            id: parseInt(id || "0"), // We don't have the episode ID, so use the show ID
            seasonNumber: prevSeason.season_number,
            episodeNumber: prevSeason.episode_count || 10 // Use episode_count if available, otherwise guess 10
          };
          console.log("Found previous season:", prevEpisode);
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
          prevEpisode={prevEpisode}
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
