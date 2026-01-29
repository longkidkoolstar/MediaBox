
import { Link } from "react-router-dom";
import { Heart, Star, Clock, Check, Eye, CheckCircle, PauseCircle, XCircle, Plus, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { useFavorites } from "../hooks/useFavorites";
import { useWatchList } from "../hooks/useWatchList";
import { useAuth } from "../contexts/AuthContext";
import { WatchStatus } from "../types/user";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export interface MediaItem {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
  media_type: "movie" | "tv" | "anime";
  release_date?: string;
  first_air_date?: string;
}

interface MediaCardProps {
  item: MediaItem;
  priority?: boolean;
}

export function MediaCard({ item, priority = false }: MediaCardProps) {
  const { currentUser } = useAuth();
  const { isFavorite, toggleFavorite, isProcessing: isFavoriteProcessing } = useFavorites();
  const { getWatchStatus, updateStatus, removeItem, isProcessing: isWatchListProcessing } = useWatchList();

  const status = getWatchStatus(item.id, item.media_type);

  const year = item.release_date
    ? new Date(item.release_date).getFullYear()
    : item.first_air_date
      ? new Date(item.first_air_date).getFullYear()
      : null;

  const rating = (item.vote_average / 2).toFixed(1);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) return;
    toggleFavorite(item.id, item.title, item.media_type);
  };

  const handleStatusChange = (newStatus: WatchStatus) => {
    if (!currentUser) return;
    updateStatus(item.id, item.title, item.media_type, newStatus);
  };

  const handleRemove = () => {
    if (!currentUser) return;
    removeItem(item.id, item.title, item.media_type);
  };

  return (
    <div className="media-card group">
      <Link to={`/${item.media_type}/${item.id}`}>
        <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted">
          <img
            src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22500%22%20height%3D%22750%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20500%20750%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_1%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A25pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_1%22%3E%3Crect%20width%3D%22500%22%20height%3D%22750%22%20fill%3D%22%23373940%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22180%22%20y%3D%22380%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E'}
            alt={item.title}
            className="w-full h-full object-cover"
            loading={priority ? "eager" : "lazy"}
            onError={(e) => {
              e.currentTarget.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22500%22%20height%3D%22750%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20500%20750%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_1%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A25pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_1%22%3E%3Crect%20width%3D%22500%22%20height%3D%22750%22%20fill%3D%22%23373940%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22180%22%20y%3D%22380%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
            }}
          />
          <div className="media-gradient-overlay p-3 flex flex-col justify-end">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-500 mr-1" />
                <span className="text-white text-sm">{rating}</span>
              </div>
              {year && <span className="text-white text-sm">{year}</span>}
            </div>
            <h3 className="text-white font-medium mt-1 line-clamp-2 text-shadow">{item.title || "Unknown Title"}</h3>
          </div>
        </div>
      </Link>
      <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="bg-black/40 backdrop-blur-sm rounded-full hover:bg-black/60"
                onClick={handleToggleFavorite}
                disabled={isFavoriteProcessing}
              >
                <Heart className={`h-4 w-4 ${isFavorite(item.id, item.media_type) ? 'fill-red-500 text-red-500' : 'text-white'}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isFavorite(item.id, item.media_type) ? 'Remove from Favorites' : 'Add to Favorites'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="bg-black/40 backdrop-blur-sm rounded-full hover:bg-black/60"
              disabled={isWatchListProcessing}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              {status === 'watching' && <Eye className="h-4 w-4 text-blue-500" />}
              {status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
              {status === 'on-hold' && <PauseCircle className="h-4 w-4 text-yellow-500" />}
              {status === 'dropped' && <XCircle className="h-4 w-4 text-red-500" />}
              {status === 'plan_to_watch' && <Clock className="h-4 w-4 text-purple-500" />}
              {!status && <Plus className="h-4 w-4 text-white" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange('watching'); }}>
              <Eye className="mr-2 h-4 w-4" /> Watching
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange('plan_to_watch'); }}>
              <Clock className="mr-2 h-4 w-4" /> Plan to Watch
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange('completed'); }}>
              <CheckCircle className="mr-2 h-4 w-4" /> Completed
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange('on-hold'); }}>
              <PauseCircle className="mr-2 h-4 w-4" /> On Hold
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange('dropped'); }}>
              <XCircle className="mr-2 h-4 w-4" /> Dropped
            </DropdownMenuItem>
            {status && (
              <>
                <div className="h-px bg-border my-1" />
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleRemove(); }} className="text-red-500 focus:text-red-500">
                  <Trash2 className="mr-2 h-4 w-4" /> Remove
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
