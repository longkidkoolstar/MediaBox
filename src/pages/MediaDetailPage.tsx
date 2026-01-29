
import { useParams, Link } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from "../components/Layout";
import { Button } from "../components/ui/button";
import { MediaCarousel } from "../components/MediaCarousel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Star, Calendar, Clock, Play, Heart, Loader2, Check, Eye, CheckCircle, PauseCircle, XCircle, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useFavorites } from "../hooks/useFavorites";
import { useWatchList } from "../hooks/useWatchList";
import { useMovieDetails, useTVShowDetails, useFirstSeasonDetails } from "../hooks/useTMDB";
import { WatchStatus } from "../types/user";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

export function MediaDetailPage() {
  const { mediaType, id } = useParams<{ mediaType: string; id: string }>();
  const { userData } = useAuth();
  const { isFavorite, toggleFavorite, isProcessing: isFavoriteProcessing } = useFavorites();
  const { getWatchStatus, updateStatus, removeItem, isProcessing: isWatchListProcessing } = useWatchList();

  // Fetch media details based on media type
  const { data: movieData, isLoading: movieLoading, error: movieError } =
    useMovieDetails(mediaType === "movie" ? id || "" : "");

  const { data: tvData, isLoading: tvLoading, error: tvError } =
    useTVShowDetails((mediaType === "tv" || mediaType === "anime") ? id || "" : "");

  // Fetch first season details for TV shows
  const { data: firstSeasonData, isLoading: seasonLoading } =
    useFirstSeasonDetails(
      (mediaType === "tv" || mediaType === "anime") ? id || "" : "",
      tvData?.seasons
    );

  const isLoading = movieLoading || tvLoading || (mediaType !== "movie" && seasonLoading);
  const error = movieError || tvError;
  const detail = mediaType === "movie" ? movieData : tvData;
  const status = detail ? getWatchStatus(detail.id, mediaType as any) : null;

  const handleToggleFavorite = () => {
    if (!detail || !mediaType) return;

    toggleFavorite(detail.id, detail.title, mediaType as 'movie' | 'tv' | 'anime');
  };

  const handleStatusChange = (newStatus: WatchStatus) => {
    if (!userData || !detail || !mediaType) return;
    updateStatus(detail.id, detail.title, mediaType as any, newStatus);
  };

  const handleRemove = () => {
    if (!userData || !detail || !mediaType) return;
    removeItem(detail.id, detail.title, mediaType as any);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="animate-pulse-slow">
          <div className="bg-muted h-[50vh] w-full flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-1/4">
                <div className="bg-muted h-[400px] w-full rounded-lg"></div>
              </div>
              <div className="w-full md:w-3/4">
                <div className="bg-muted h-12 w-3/4 rounded-md mb-4"></div>
                <div className="bg-muted h-6 w-1/2 rounded-md mb-6"></div>
                <div className="space-y-2 mb-6">
                  <div className="bg-muted h-4 w-full rounded-md"></div>
                  <div className="bg-muted h-4 w-full rounded-md"></div>
                  <div className="bg-muted h-4 w-3/4 rounded-md"></div>
                </div>
                <div className="flex gap-2 mb-8">
                  <div className="bg-muted h-10 w-32 rounded-md"></div>
                  <div className="bg-muted h-10 w-32 rounded-md"></div>
                </div>
                <div className="bg-muted h-8 w-64 rounded-md mb-4"></div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-muted h-24 w-full rounded-md"></div>
                  <div className="bg-muted h-24 w-full rounded-md"></div>
                  <div className="bg-muted h-24 w-full rounded-md"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !detail) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Media not found</h1>
          <p className="text-muted-foreground mb-6">
            {error ? `Error: ${error.message}` : "The requested content could not be found."}
          </p>
          <Button asChild>
            <Link to="/">Return to Home</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  // Format release date or first air date
  const releaseDate = detail.release_date
    ? new Date(detail.release_date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    : detail.first_air_date
      ? new Date(detail.first_air_date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
      : null;

  // Format runtime
  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Format rating
  const rating = (detail.vote_average / 2).toFixed(1);

  // Format media type for display
  const formattedMediaType = mediaType === "tv"
    ? "TV Series"
    : mediaType === "anime"
      ? "Anime"
      : "Movie";

  return (
    <Layout>
      {/* Hero Banner */}
      <div className="relative">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40 z-10"></div>
          <img
            src={detail.backdrop_path ? `https://image.tmdb.org/t/p/original${detail.backdrop_path}` : 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%221920%22%20height%3D%221080%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%201920%201080%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_1%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A96pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_1%22%3E%3Crect%20width%3D%221920%22%20height%3D%221080%22%20fill%3D%22%23373940%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22700%22%20y%3D%22550%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E'}
            alt={detail.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%221920%22%20height%3D%221080%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%201920%201080%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_1%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A96pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_1%22%3E%3Crect%20width%3D%221920%22%20height%3D%221080%22%20fill%3D%22%23373940%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22700%22%20y%3D%22550%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
            }}
          />
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="max-w-3xl">
            {detail.tagline && (
              <p className="text-primary font-medium mb-2">{detail.tagline}</p>
            )}
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">{detail.title}</h1>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-white/80 text-sm mb-6">
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-500 mr-1" />
                <span>{rating}/5</span>
              </div>
              {releaseDate && (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{releaseDate}</span>
                </div>
              )}
              {detail.media_type === 'movie' && detail.runtime && (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{formatRuntime(detail.runtime)}</span>
                </div>
              )}
              {(detail.media_type === 'tv' || detail.media_type === 'anime') && detail.episode_run_time && detail.episode_run_time.length > 0 && (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{formatRuntime(detail.episode_run_time[0])}</span>
                </div>
              )}
              <div className="flex items-center">
                <span>{formattedMediaType}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {detail.genres.map((genre: string) => (
                <span key={genre} className="px-3 py-1 bg-white/10 rounded-full text-sm text-white/90">
                  {genre}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button className="bg-primary hover:bg-primary/90 flex items-center gap-2">
                <Play className="h-4 w-4" />
                <Link to={`/${mediaType}/${id}/watch`}>
                  Watch Now
                </Link>
              </Button>
              <Button
                variant="outline"
                className="text-white border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/20 flex items-center gap-2"
                onClick={handleToggleFavorite}
                disabled={isFavoriteProcessing || !userData}
              >
                {isFavoriteProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Heart className={`h-4 w-4 ${isFavorite(detail.id, mediaType as 'movie' | 'tv' | 'anime') ? 'fill-red-500 text-red-500' : ''}`} />
                    {isFavorite(detail.id, mediaType as 'movie' | 'tv' | 'anime') ? 'Remove from Favorites' : 'Add to Favorites'}
                  </>
                )}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="text-white border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/20 flex items-center gap-2"
                    disabled={isWatchListProcessing || !userData}
                  >
                    {isWatchListProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {status === 'watching' && <><Eye className="h-4 w-4 text-blue-500" /> Watching</>}
                        {status === 'completed' && <><CheckCircle className="h-4 w-4 text-green-500" /> Completed</>}
                        {status === 'on-hold' && <><PauseCircle className="h-4 w-4 text-yellow-500" /> On Hold</>}
                        {status === 'dropped' && <><XCircle className="h-4 w-4 text-red-500" /> Dropped</>}
                        {status === 'plan_to_watch' && <><Clock className="h-4 w-4 text-purple-500" /> Plan to Watch</>}
                        {!status && <><Clock className="h-4 w-4" /> Add to Watchlist</>}
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleStatusChange('watching')}>
                    <Eye className="mr-2 h-4 w-4" /> Watching
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange('plan_to_watch')}>
                    <Clock className="mr-2 h-4 w-4" /> Plan to Watch
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange('completed')}>
                    <CheckCircle className="mr-2 h-4 w-4" /> Completed
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange('on-hold')}>
                    <PauseCircle className="mr-2 h-4 w-4" /> On Hold
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange('dropped')}>
                    <XCircle className="mr-2 h-4 w-4" /> Dropped
                  </DropdownMenuItem>
                  {status && (
                    <>
                      <div className="h-px bg-border my-1" />
                      <DropdownMenuItem onClick={handleRemove} className="text-red-500 focus:text-red-500">
                        <Trash2 className="mr-2 h-4 w-4" /> Remove
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-1/4">
            <img
              src={detail.poster_path ? `https://image.tmdb.org/t/p/w500${detail.poster_path}` : 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22500%22%20height%3D%22750%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20500%20750%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_1%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A25pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_1%22%3E%3Crect%20width%3D%22500%22%20height%3D%22750%22%20fill%3D%22%23373940%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22180%22%20y%3D%22380%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E'}
              alt={detail.title}
              className="w-full rounded-lg shadow-lg mb-6"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22500%22%20height%3D%22750%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20500%20750%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_1%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A25pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_1%22%3E%3Crect%20width%3D%22500%22%20height%3D%22750%22%20fill%3D%22%23373940%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22180%22%20y%3D%22380%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
              }}
            />

            {detail.videos && detail.videos.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-3">Watch Trailer</h3>
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${detail.videos[0].key}`}
                    title="Trailer"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            )}

            {detail.credits && detail.credits.cast && (
              <div>
                <h3 className="text-xl font-semibold mb-3">Cast</h3>
                <div className="space-y-4">
                  {detail.credits.cast.slice(0, 5).map((actor: any) => (
                    <div key={actor.name} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted overflow-hidden">
                        {actor.profile_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w200${actor.profile_path}`}
                            alt={actor.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = `data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22200%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20200%20200%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_1%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A40pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_1%22%3E%3Crect%20width%3D%22200%22%20height%3D%22200%22%20fill%3D%22%23373940%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2290%22%20y%3D%22110%22%3E${actor.name.charAt(0)}%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E`;
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/20 text-primary font-medium">
                            {actor.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{actor.name}</p>
                        <p className="text-sm text-muted-foreground">{actor.character}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="w-full md:w-3/4">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Overview</h2>
              <p className="text-muted-foreground">{detail.overview}</p>
            </div>

            {(mediaType === "tv" || mediaType === "anime") && 'seasons' in detail && detail.seasons && (
              <div className="mb-8">
                <Tabs defaultValue="episodes">
                  <TabsList>
                    <TabsTrigger value="episodes">Episodes</TabsTrigger>
                    <TabsTrigger value="seasons">Seasons</TabsTrigger>
                  </TabsList>

                  <TabsContent value="episodes" className="mt-4">
                    <div className="space-y-4">
                      {firstSeasonData && firstSeasonData.episodes && firstSeasonData.episodes.length > 0 ? (
                        firstSeasonData.episodes.map((episode: any) => (
                          <div key={episode.id} className="flex flex-col md:flex-row gap-4 border-b border-border pb-4">
                            {episode.still_path ? (
                              <div className="w-full md:w-48 h-28 bg-muted rounded-lg overflow-hidden">
                                <img
                                  src={`https://image.tmdb.org/t/p/w300${episode.still_path}`}
                                  alt={episode.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22300%22%20height%3D%22169%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20300%20169%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_1%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A15pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_1%22%3E%3Crect%20width%3D%22300%22%20height%3D%22169%22%20fill%3D%22%23373940%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22110.0859375%22%20y%3D%2291.2%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="w-full md:w-48 h-28 bg-muted rounded-lg overflow-hidden flex items-center justify-center text-muted-foreground">
                                No Image
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <div>
                                  <h3 className="font-medium">{episode.episode_number}. {episode.name}</h3>
                                  <p className="text-sm text-muted-foreground line-clamp-2">{episode.overview}</p>
                                </div>
                                <Button variant="ghost" size="sm" className="shrink-0" asChild>
                                  <Link to={`/${mediaType}/${id}/watch?season=${firstSeasonData.season_number}&episode=${episode.episode_number}`}>
                                    <Play className="h-4 w-4 mr-1" /> Play
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">No episodes available for this season.</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="seasons" className="mt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {detail.seasons.map((season: any) => (
                        <div key={season.id} className="border border-border rounded-lg overflow-hidden">
                          {season.poster_path && (
                            <img
                              src={`https://image.tmdb.org/t/p/w300${season.poster_path}`}
                              alt={season.name}
                              className="w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22300%22%20height%3D%22450%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20300%20450%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_1%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A15pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_1%22%3E%3Crect%20width%3D%22300%22%20height%3D%22450%22%20fill%3D%22%23373940%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22110.0859375%22%20y%3D%22231.2%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
                              }}
                            />
                          )}
                          <div className="p-4">
                            <h3 className="font-medium">{season.name}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{season.episode_count} episodes</p>
                            <Button variant="link" className="text-primary p-0 h-auto" asChild>
                              <Link to={`/${mediaType}/${id}/season/${season.season_number}`}>
                                View Episodes
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* Similar Content */}
            {detail.similar && detail.similar.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Similar {formattedMediaType}s</h2>
                <MediaCarousel
                  title=""
                  items={detail.similar.map((item: any) => ({...item, media_type: mediaType}))}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default MediaDetailPage;
