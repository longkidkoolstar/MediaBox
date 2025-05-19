
import { useRef } from "react";
import { MediaCard, MediaItem } from "./MediaCard";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MediaCarouselProps {
  title: string;
  items: MediaItem[];
  seeAllLink?: string;
}

export function MediaCarousel({ title, items, seeAllLink }: MediaCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (carouselRef.current) {
      const scrollAmount = carouselRef.current.clientWidth * 0.75;
      carouselRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      const scrollAmount = carouselRef.current.clientWidth * 0.75;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex items-center gap-2">
          {seeAllLink && (
            <a 
              href={seeAllLink} 
              className="text-sm text-primary hover:underline"
            >
              See all
            </a>
          )}
          <div className="hidden md:flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={scrollLeft}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline" 
              size="icon"
              className="rounded-full"
              onClick={scrollRight}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <div 
        ref={carouselRef}
        className="carousel"
      >
        {items.map((item, index) => (
          <div 
            key={item.id} 
            className="carousel-item w-[160px] md:w-[200px]"
          >
            <MediaCard item={item} priority={index < 5} />
          </div>
        ))}
      </div>
    </div>
  );
}
