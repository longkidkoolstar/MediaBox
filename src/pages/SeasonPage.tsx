import { useParams, Link } from "react-router-dom";
import { Layout } from "../components/Layout";
import { Button } from "../components/ui/button";
import { Play, Loader2, ArrowLeft } from "lucide-react";
import { useTVShowDetails, useTVSeasonDetails } from "../hooks/useTMDB";

export function SeasonPage() {
  const { mediaType, id, seasonNumber } = useParams<{ mediaType: string; id: string; seasonNumber: string }>();
  const seasonNum = parseInt(seasonNumber || "1");

  // Fetch TV show details
  const { data: tvData, isLoading: tvLoading, error: tvError } =
    useTVShowDetails((mediaType === "tv" || mediaType === "anime") ? id || "" : "");

  // Fetch season details
  const { data: seasonData, isLoading: seasonLoading, error: seasonError } =
    useTVSeasonDetails(id || "", seasonNum);

  const isLoading = tvLoading || seasonLoading;
  const error = tvError || seasonError;

  if (isLoading) {
    return (
      <Layout>
        <div className="animate-pulse-slow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !tvData || !seasonData) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Season not found</h1>
          <p className="text-muted-foreground mb-6">
            {error ? `Error: ${error.message}` : "The requested season could not be found."}
          </p>
          <Button asChild>
            <Link to={`/${mediaType}/${id}`}>Return to Show Details</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="pl-0">
            <Link to={`/${mediaType}/${id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {tvData.title}
            </Link>
          </Button>
        </div>

        {/* Season header */}
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          <div className="w-full md:w-1/4">
            {seasonData.poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w500${seasonData.poster_path}`}
                alt={seasonData.name}
                className="w-full rounded-lg shadow-lg"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22500%22%20height%3D%22750%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20500%20750%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_1%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A25pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_1%22%3E%3Crect%20width%3D%22500%22%20height%3D%22750%22%20fill%3D%22%23373940%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22180%22%20y%3D%22380%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
                }}
              />
            ) : (
              <div className="w-full aspect-[2/3] bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                No Image
              </div>
            )}
          </div>

          <div className="w-full md:w-3/4">
            <h1 className="text-3xl font-bold mb-2">{tvData.title} - {seasonData.name}</h1>
            <p className="text-muted-foreground mb-4">{seasonData.episodes?.length || 0} Episodes</p>
            
            {seasonData.overview && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Overview</h2>
                <p className="text-muted-foreground">{seasonData.overview}</p>
              </div>
            )}
            
            {seasonData.air_date && (
              <p className="text-sm text-muted-foreground">
                Air Date: {new Date(seasonData.air_date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
        </div>

        {/* Episodes list */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-6">Episodes</h2>
          
          {seasonData.episodes && seasonData.episodes.length > 0 ? (
            <div className="space-y-6">
              {seasonData.episodes.map((episode: any) => (
                <div key={episode.id} className="flex flex-col md:flex-row gap-4 border border-border rounded-lg overflow-hidden">
                  <div className="w-full md:w-1/3 h-48 md:h-auto bg-muted">
                    {episode.still_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w500${episode.still_path}`}
                        alt={episode.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22500%22%20height%3D%22281%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20500%20281%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_1%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A25pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_1%22%3E%3Crect%20width%3D%22500%22%20height%3D%22281%22%20fill%3D%22%23373940%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22180%22%20y%3D%22150%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No Image
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 p-4 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-xl font-semibold">
                          {episode.episode_number}. {episode.name}
                        </h3>
                        {episode.air_date && (
                          <p className="text-sm text-muted-foreground">
                            Air Date: {new Date(episode.air_date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                      <Button asChild>
                        <Link to={`/${mediaType}/${id}/watch?season=${seasonNum}&episode=${episode.episode_number}`}>
                          <Play className="h-4 w-4 mr-2" /> Play
                        </Link>
                      </Button>
                    </div>
                    
                    <p className="text-muted-foreground flex-grow">{episode.overview || "No description available."}</p>
                    
                    {episode.runtime && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Runtime: {episode.runtime} min
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-border rounded-lg">
              <p className="text-muted-foreground">No episodes available for this season.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default SeasonPage;
