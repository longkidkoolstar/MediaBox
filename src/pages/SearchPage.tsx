
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Layout } from "../components/Layout";
import { MediaGrid } from "../components/MediaGrid";
import { Button } from "../components/ui/button";
import { MediaItem } from "../components/MediaCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useSearchMedia } from "../hooks/useTMDB";
import { Loader2 } from "lucide-react";

export function SearchPage() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const searchQuery = queryParams.get('q') || '';

  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);

  // Use the real search API
  const { data: searchData, isLoading } = useSearchMedia(searchQuery, page);
  const searchResults = searchData?.results || [];

  // Filter results based on active tab
  const filteredResults = searchResults.filter(item => {
    if (activeTab === "all") return true;
    return item.media_type === activeTab;
  });

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-4">Search Results for "{searchQuery}"</h1>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="movie">Movies</TabsTrigger>
              <TabsTrigger value="tv">TV Shows</TabsTrigger>
              <TabsTrigger value="anime">Anime</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort By:</span>
              <Button variant="outline" size="sm">Relevance</Button>
              <Button variant="outline" size="sm">Latest</Button>
            </div>
          </div>

          <TabsContent value="all" className="mt-6">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="aspect-[2/3] bg-muted rounded-lg animate-pulse-slow"></div>
                ))}
              </div>
            ) : filteredResults.length > 0 ? (
              <>
                <MediaGrid items={filteredResults} />
                {searchData && searchData.total_pages > 1 && (
                  <div className="flex justify-center mt-8 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-4">
                      Page {page} of {searchData.total_pages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setPage(p => Math.min(searchData.total_pages, p + 1))}
                      disabled={page === searchData.total_pages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="py-20 text-center">
                <h3 className="text-xl font-medium text-muted-foreground mb-2">No results found</h3>
                <p className="text-muted-foreground">Try different keywords or browse categories</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="movie" className="mt-6">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-[2/3] bg-muted rounded-lg animate-pulse-slow"></div>
                ))}
              </div>
            ) : filteredResults.length > 0 ? (
              <>
                <MediaGrid items={filteredResults} />
                {searchData && searchData.total_pages > 1 && (
                  <div className="flex justify-center mt-8 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-4">
                      Page {page} of {searchData.total_pages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setPage(p => Math.min(searchData.total_pages, p + 1))}
                      disabled={page === searchData.total_pages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="py-20 text-center">
                <h3 className="text-xl font-medium text-muted-foreground mb-2">No movie results found</h3>
                <p className="text-muted-foreground">Try different keywords or browse categories</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="tv" className="mt-6">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-[2/3] bg-muted rounded-lg animate-pulse-slow"></div>
                ))}
              </div>
            ) : filteredResults.length > 0 ? (
              <>
                <MediaGrid items={filteredResults} />
                {searchData && searchData.total_pages > 1 && (
                  <div className="flex justify-center mt-8 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-4">
                      Page {page} of {searchData.total_pages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setPage(p => Math.min(searchData.total_pages, p + 1))}
                      disabled={page === searchData.total_pages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="py-20 text-center">
                <h3 className="text-xl font-medium text-muted-foreground mb-2">No TV Show results found</h3>
                <p className="text-muted-foreground">Try different keywords or browse categories</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="anime" className="mt-6">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-[2/3] bg-muted rounded-lg animate-pulse-slow"></div>
                ))}
              </div>
            ) : filteredResults.length > 0 ? (
              <>
                <MediaGrid items={filteredResults} />
                {searchData && searchData.total_pages > 1 && (
                  <div className="flex justify-center mt-8 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-4">
                      Page {page} of {searchData.total_pages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setPage(p => Math.min(searchData.total_pages, p + 1))}
                      disabled={page === searchData.total_pages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="py-20 text-center">
                <h3 className="text-xl font-medium text-muted-foreground mb-2">No Anime results found</h3>
                <p className="text-muted-foreground">Try different keywords or browse categories</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

export default SearchPage;
