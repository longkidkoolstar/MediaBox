
import { useState } from "react";
import { Layout } from "../components/Layout";
import { MediaGrid } from "../components/MediaGrid";
import { trendingAnime, genresList } from "../data/dummyData";
import { Button } from "../components/ui/button";

export function AnimePage() {
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState("popularity");
  
  const toggleGenre = (genreId: number) => {
    if (selectedGenres.includes(genreId)) {
      setSelectedGenres(selectedGenres.filter(id => id !== genreId));
    } else {
      setSelectedGenres([...selectedGenres, genreId]);
    }
  };
  
  // Format anime shows data for the MediaGrid component
  const animeData = trendingAnime.map(anime => ({
    ...anime,
    media_type: "anime"
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
                {["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Mecha", "Romance", "Sci-Fi", "Slice of Life"].map((genre, index) => (
                  <Button
                    key={index}
                    variant={selectedGenres.includes(index) ? "default" : "outline"}
                    className="text-xs py-1 h-auto"
                    onClick={() => toggleGenre(index)}
                  >
                    {genre}
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
              <h3 className="text-lg font-medium mb-3">Type</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  TV Series
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Movie
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  OVA
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Special
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-3">Status</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  Currently Airing
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Finished Airing
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Upcoming
                </Button>
              </div>
            </div>
          </div>
          
          {/* Anime Grid */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-6">Anime</h1>
            <MediaGrid items={animeData} />
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default AnimePage;
