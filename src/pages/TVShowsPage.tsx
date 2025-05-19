
import { useState } from "react";
import { Layout } from "../components/Layout";
import { MediaGrid } from "../components/MediaGrid";
import { trendingTVShows, genresList } from "../data/dummyData";
import { Button } from "../components/ui/button";

export function TVShowsPage() {
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState("popularity");
  
  const toggleGenre = (genreId: number) => {
    if (selectedGenres.includes(genreId)) {
      setSelectedGenres(selectedGenres.filter(id => id !== genreId));
    } else {
      setSelectedGenres([...selectedGenres, genreId]);
    }
  };
  
  // Format TV shows data for the MediaGrid component
  const tvShowsData = trendingTVShows.map(show => ({
    ...show,
    media_type: "tv"
  }));
  
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Filters */}
          <div className="w-full md:w-64 space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Genres</h3>
              <div className="flex flex-wrap gap-2">
                {genresList.slice(0, 12).map((genre) => (
                  <Button
                    key={genre.id}
                    variant={selectedGenres.includes(genre.id) ? "default" : "outline"}
                    className="text-xs py-1 h-auto"
                    onClick={() => toggleGenre(genre.id)}
                  >
                    {genre.name}
                  </Button>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-3">Sort By</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={sortBy === "popularity" ? "default" : "outline"}
                  onClick={() => setSortBy("popularity")}
                >
                  Popularity
                </Button>
                <Button
                  variant={sortBy === "rating" ? "default" : "outline"}
                  onClick={() => setSortBy("rating")}
                >
                  Rating
                </Button>
                <Button
                  variant={sortBy === "newest" ? "default" : "outline"}
                  onClick={() => setSortBy("newest")}
                >
                  Newest
                </Button>
                <Button
                  variant={sortBy === "oldest" ? "default" : "outline"}
                  onClick={() => setSortBy("oldest")}
                >
                  Oldest
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-3">Network</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  Netflix
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  HBO
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Amazon Prime
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Disney+
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Hulu
                </Button>
              </div>
            </div>
          </div>
          
          {/* TV Shows Grid */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-6">TV Shows</h1>
            <MediaGrid items={tvShowsData} />
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default TVShowsPage;
