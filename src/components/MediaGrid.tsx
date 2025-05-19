
import { MediaCard, MediaItem } from "./MediaCard";
import { useFavorites } from "../hooks/useFavorites";
import { useWatchLater } from "../hooks/useWatchLater";
import { useAuth } from "../contexts/AuthContext";
import { Heart, Clock } from "lucide-react";
import { cn } from "../lib/utils";

interface MediaGridProps {
  items: MediaItem[];
  title?: string;
}

export function MediaGrid({ items, title }: MediaGridProps) {
  const { currentUser } = useAuth();
  const { isFavorite } = useFavorites();
  const { isInWatchLater } = useWatchLater();

  if (items.length === 0) {
    return (
      <div className="py-12 text-center">
        <h3 className="text-xl font-medium text-muted-foreground">No items found</h3>
      </div>
    );
  }

  return (
    <div className="py-6">
      {title && <h2 className="text-xl font-semibold mb-6">{title}</h2>}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {items.map((item, index) => (
          <div key={item.id} className="relative">
            {currentUser && (
              <div className="absolute top-2 left-2 z-10 flex gap-1">
                {isFavorite(item.id, item.media_type) && (
                  <div className="bg-black/60 backdrop-blur-sm p-1 rounded-full">
                    <Heart className="h-3 w-3 fill-red-500 text-red-500" />
                  </div>
                )}
                {isInWatchLater(item.id, item.media_type) && (
                  <div className="bg-black/60 backdrop-blur-sm p-1 rounded-full">
                    <Clock className="h-3 w-3 text-green-500" />
                  </div>
                )}
              </div>
            )}
            <MediaCard item={item} priority={index < 12} />
          </div>
        ))}
      </div>
    </div>
  );
}
