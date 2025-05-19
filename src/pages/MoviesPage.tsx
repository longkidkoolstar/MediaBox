
import { useState } from "react";
import { Layout } from "../components/Layout";
import { MediaGrid } from "../components/MediaGrid";
import { Button } from "../components/ui/button";
import { useTrendingMovies, useMovieGenres } from "../hooks/useTMDB";
import { Loader2 } from "lucide-react";

export function MoviesPage() {
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState("popularity");
  const [yearRange, setYearRange] = useState<[number, number]>([2000, 2023]);
  const [page, setPage] = useState(1);

  // Fetch real data from TMDB API
  const { data: moviesData, isLoading: moviesLoading } = useTrendingMovies(page);
  const { data: genresData, isLoading: genresLoading } = useMovieGenres();

  const toggleGenre = (genreId: number) => {
    if (selectedGenres.includes(genreId)) {
      setSelectedGenres(selectedGenres.filter(id => id !== genreId));
    } else {
      setSelectedGenres([...selectedGenres, genreId]);
    }
  };

  const isLoading = moviesLoading || genresLoading;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Filters */}
          <div className="w-full md:w-64 space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Genres</h3>
              <div className="flex flex-wrap gap-2">
                {genresLoading ? (
                  <div className="flex items-center justify-center w-full py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  genresData?.slice(0, 12).map((genre) => (
                    <Button
                      key={genre.id}
                      variant={selectedGenres.includes(genre.id) ? "default" : "outline"}
                      className="text-xs py-1 h-auto"
                      onClick={() => toggleGenre(genre.id)}
                    >
                      {genre.name}
                    </Button>
                  ))
                )}
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
              <h3 className="text-lg font-medium mb-3">Release Year</h3>
              <div className="flex justify-between mb-2">
                <span>{yearRange[0]}</span>
                <span>{yearRange[1]}</span>
              </div>
              {/* Simplified range slider for demo */}
              <div className="h-2 bg-muted rounded-full relative">
                <div className="absolute h-full bg-primary rounded-full" style={{
                  left: `${((yearRange[0] - 2000) / 23) * 100}%`,
                  right: `${100 - ((yearRange[1] - 2000) / 23) * 100}%`
                }}></div>
              </div>
            </div>
          </div>

          {/* Movies Grid */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-6">Movies</h1>
            {moviesLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <MediaGrid items={moviesData?.results || []} />
                {moviesData && moviesData.total_pages > 1 && (
                  <div className="flex justify-center mt-8 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-4">
                      Page {page} of {moviesData.total_pages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setPage(p => Math.min(moviesData.total_pages, p + 1))}
                      disabled={page === moviesData.total_pages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default MoviesPage;
