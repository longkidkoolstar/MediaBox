
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import { Play, Info } from "lucide-react";

interface HeroItem {
  id: number;
  title: string;
  backdrop_path: string;
  overview: string;
  media_type: "movie" | "tv" | "anime";
  release_date?: string;
  first_air_date?: string;
}

interface HeroSectionProps {
  items: HeroItem[];
}

export function HeroSection({ items }: HeroSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Auto rotate hero items
  useEffect(() => {
    if (items.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [items.length]);

  const currentItem = items[currentIndex];

  if (!currentItem) return null;

  const year = currentItem.release_date
    ? new Date(currentItem.release_date).getFullYear()
    : currentItem.first_air_date
      ? new Date(currentItem.first_air_date).getFullYear()
      : null;

  const truncateOverview = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  return (
    <div className="relative w-full">
      <div className="relative h-[60vh] md:h-[75vh] overflow-hidden">
        {/* Hero background */}
        <div className="absolute inset-0 transition-opacity duration-1000">
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30 z-10"></div>

          {items.map((item, index) => (
            <div
              key={item.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentIndex ? "opacity-100" : "opacity-0"
              }`}
            >
              <img
                src={item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%221920%22%20height%3D%221080%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%201920%201080%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_1%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A96pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_1%22%3E%3Crect%20width%3D%221920%22%20height%3D%221080%22%20fill%3D%22%23373940%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22700%22%20y%3D%22550%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E'}
                alt={item.title}
                className="w-full h-full object-cover object-top"
                onLoad={() => setIsLoaded(true)}
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%221920%22%20height%3D%221080%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%201920%201080%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_1%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A96pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_1%22%3E%3Crect%20width%3D%221920%22%20height%3D%221080%22%20fill%3D%22%23373940%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22700%22%20y%3D%22550%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
                  setIsLoaded(true);
                }}
              />
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="absolute inset-0 z-20 flex flex-col justify-end px-4 sm:px-6 lg:px-8 pb-20 max-w-7xl mx-auto">
          <div className={`max-w-2xl transition-all duration-700 transform ${
            isLoaded ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
          }`}>
            <div className="text-xs md:text-sm text-primary mb-2">
              {year && <span className="mr-2">{year}</span>}
              <span className="uppercase">
                {currentItem.media_type === "tv"
                  ? "TV Series"
                  : currentItem.media_type === "anime"
                    ? "Anime"
                    : "Movie"}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">{currentItem.title}</h1>
            <p className="text-white/90 text-sm md:text-base mb-6">
              {truncateOverview(currentItem.overview, 180)}
            </p>
            <div className="flex flex-wrap gap-4">
              <Button className="bg-primary hover:bg-primary/90 flex items-center gap-2">
                <Play className="h-4 w-4" />
                <Link to={`/${currentItem.media_type}/${currentItem.id}/watch`}>
                  Watch Now
                </Link>
              </Button>
              <Button variant="outline" className="text-white border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/20 flex items-center gap-2">
                <Info className="h-4 w-4" />
                <Link to={`/${currentItem.media_type}/${currentItem.id}`}>
                  More Info
                </Link>
              </Button>
            </div>
          </div>

          {/* Pagination dots */}
          {items.length > 1 && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2">
              {items.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex ? "bg-white w-6" : "bg-white/50"
                  }`}
                  onClick={() => setCurrentIndex(index)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
