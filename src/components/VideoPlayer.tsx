import { useState, useRef, useEffect } from "react";
import { Settings, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
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
  onProgressUpdate
}: VideoPlayerProps) {
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

  return (
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
  );
}

export default VideoPlayer;
