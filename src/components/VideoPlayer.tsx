import { useState, useRef, useEffect } from "react";
import { Settings, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface VideoSource {
  name: string;
  url: string;
}

interface VideoPlayerProps {
  title: string;
  sources: VideoSource[];
  poster?: string;
  mediaId: number;
  mediaType: string;
  episodeNumber?: number;
  seasonNumber?: number;
  nextEpisode?: {
    id: number;
    seasonNumber: number;
    episodeNumber: number;
  };
  prevEpisode?: {
    id: number;
    seasonNumber: number;
    episodeNumber: number;
  };
  onProgressUpdate?: (progress: number) => void;
}

export function VideoPlayer({
  title,
  sources,
  poster,
  mediaId,
  mediaType,
  episodeNumber,
  seasonNumber,
  nextEpisode,
  prevEpisode,
  onProgressUpdate
}: VideoPlayerProps) {
  const navigate = useNavigate();
  const [activeSource, setActiveSource] = useState<VideoSource>(sources.length > 0 ? sources[0] : { name: '', url: '' });
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Update active source when sources change
  useEffect(() => {
    if (sources.length > 0 && !sources.find(s => s.name === activeSource.name)) {
      setActiveSource(sources[0]);
    }
  }, [sources, activeSource.name]);

  // Track progress for watch history
  useEffect(() => {
    // We can't directly track progress from embedded iframes due to cross-origin restrictions
    // Instead, we'll update progress periodically assuming the user is watching
    if (!onProgressUpdate) return;

    // Initial progress update (start watching)
    onProgressUpdate(10);

    // Update progress every minute
    const interval = setInterval(() => {
      // Increment progress by 10% every minute, up to 90%
      // We don't set it to 100% automatically to avoid marking unwatched content as completed
      onProgressUpdate(Math.min(90, Math.floor(Date.now() / 60000) % 10 * 10));
    }, 60000); // Update every minute

    // Mark as 95% complete when component unmounts (user navigates away)
    return () => {
      clearInterval(interval);
      onProgressUpdate(95);
    };
  }, [onProgressUpdate]);

  // Switch to a different video source
  const switchSource = (source: VideoSource) => {
    setActiveSource(source);
  };

  // Navigate to previous episode
  const goToPrevEpisode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!prevEpisode) return;
    console.log("Navigating to previous episode");
    window.location.href = `/${mediaType}/${mediaId}/watch?season=${prevEpisode.seasonNumber}&episode=${prevEpisode.episodeNumber}`;
  };

  // Navigate to next episode
  const goToNextEpisode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!nextEpisode) return;
    console.log("Navigating to next episode");
    window.location.href = `/${mediaType}/${mediaId}/watch?season=${nextEpisode.seasonNumber}&episode=${nextEpisode.episodeNumber}`;
  };

  // Check if this is a TV show (to show episode navigation)
  const isTVShow = mediaType === 'tv' || mediaType === 'anime';

  // Debug information
  useEffect(() => {
    if (isTVShow) {
      console.log("TV Show Navigation Debug:");
      console.log("Media Type:", mediaType);
      console.log("Season:", seasonNumber);
      console.log("Episode:", episodeNumber);
      console.log("Next Episode:", nextEpisode);
      console.log("Previous Episode:", prevEpisode);
    }
  }, [isTVShow, mediaType, seasonNumber, episodeNumber, nextEpisode, prevEpisode]);

  return (
    <>
      <div className="relative bg-black w-full aspect-video">
        {/* Back button (always visible) */}
        <div className="absolute top-4 left-4 z-20">
          <Link to={`/${mediaType}/${mediaId}`}>
            <Button variant="ghost" size="icon" className="bg-black/40 backdrop-blur-sm text-white rounded-full hover:bg-black/60">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
        </div>

        {/* Source selector (always visible) */}
        <div className="absolute top-4 right-4 z-20">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="bg-black/40 backdrop-blur-sm text-white rounded-full hover:bg-black/60">
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Video Sources</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {sources.map((source) => (
                <DropdownMenuItem
                  key={source.name}
                  onClick={() => switchSource(source)}
                  className={source.name === activeSource.name ? "bg-muted" : ""}
                >
                  {source.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Embedded video player */}
        {activeSource.url ? (
          <iframe
            ref={iframeRef}
            src={activeSource.url}
            title={title}
            className="w-full h-full border-0"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          ></iframe>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-black text-white">
            <p>No video source available</p>
          </div>
        )}
      </div>

      {/* Episode navigation buttons (only for TV shows) - positioned below the player */}
      {isTVShow && (
        <div className="flex justify-center gap-4 mt-4 mb-2">
          {prevEpisode ? (
            <a
              href={`/${mediaType}/${mediaId}/watch?season=${prevEpisode.seasonNumber}&episode=${prevEpisode.episodeNumber}`}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => console.log("Clicked Previous Episode")}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous Episode
            </a>
          ) : (
            <button
              disabled
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium px-4 py-2 bg-primary/30 text-primary-foreground opacity-40 cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous Episode
            </button>
          )}

          {nextEpisode ? (
            <a
              href={`/${mediaType}/${mediaId}/watch?season=${nextEpisode.seasonNumber}&episode=${nextEpisode.episodeNumber}`}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => console.log("Clicked Next Episode")}
            >
              Next Episode <ChevronRight className="h-4 w-4 ml-1" />
            </a>
          ) : (
            <button
              disabled
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium px-4 py-2 bg-primary/30 text-primary-foreground opacity-40 cursor-not-allowed"
            >
              Next Episode <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          )}
        </div>
      )}

      {/* Debug information for development */}
      {isTVShow && process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-muted-foreground mt-1 mb-4 text-center">
          {prevEpisode ? `Previous: S${prevEpisode.seasonNumber}E${prevEpisode.episodeNumber}` : 'No previous episode'} |
          Current: S{seasonNumber}E{episodeNumber} |
          {nextEpisode ? `Next: S${nextEpisode.seasonNumber}E${nextEpisode.episodeNumber}` : 'No next episode'}
        </div>
      )}
    </>
  );
}

export default VideoPlayer;
