import { useState } from "react";
import { Layout } from "../components/Layout";
import { Button } from "../components/ui/button";
import { History, Loader2, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useWatchHistory } from "../hooks/useWatchHistory";
import { WatchHistoryItem } from "../types/user";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";

export function WatchHistoryPage() {
  const { userData, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { removeHistory, clearHistory, isProcessing } = useWatchHistory();
  const [selectedItem, setSelectedItem] = useState<WatchHistoryItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isClearingHistory, setIsClearingHistory] = useState(false);

  const formatLastWatched = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleRemoveFromHistory = (item: WatchHistoryItem) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
  };

  const confirmRemoveFromHistory = async () => {
    if (!selectedItem) return;

    await removeHistory(selectedItem.id, selectedItem.media_type, selectedItem.title);
    setIsDialogOpen(false);
  };

  const handleClearHistory = () => {
    setSelectedItem(null);
    setIsClearingHistory(true);
    setIsDialogOpen(true);
  };

  const confirmClearHistory = async () => {
    await clearHistory();
    setIsDialogOpen(false);
    setIsClearingHistory(false);
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold">Loading watch history...</h2>
          </div>
        </div>
      </Layout>
    );
  }

  if (!userData) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">You need to be logged in to view your watch history</h2>
            <Button onClick={() => navigate("/login")}>Sign In</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Watch History</h1>
          {userData.watchHistory && userData.watchHistory.length > 0 && (
            <Button variant="outline" onClick={handleClearHistory}>
              Clear History
            </Button>
          )}
        </div>

        {userData.watchHistory && userData.watchHistory.length > 0 ? (
          <div className="space-y-4">
            {userData.watchHistory.map((item) => (
              <div key={`${item.id}-${item.media_type}`} className="flex items-center gap-4 border border-border rounded-lg p-4 group hover:bg-card/50 transition-colors">
                <img
                  src={`https://image.tmdb.org/t/p/w200${item.poster_path}`}
                  alt={item.title}
                  className="w-16 h-24 rounded-md object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-medium">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.media_type === "movie" ? "Movie" : item.media_type === "tv" ? "TV Show" : "Anime"}
                    {item.season && item.episode && ` • Season ${item.season}, Episode ${item.episode}`}
                  </p>
                  <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${item.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.progress}% • Last watched {formatLastWatched(item.lastWatched)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" asChild>
                    <a href={`/${item.media_type}/${item.id}/watch${item.season && item.episode ? `?season=${item.season}&episode=${item.episode}` : ''}`}>
                      <Play className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveFromHistory(item)}
                    disabled={isProcessing}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No watch history</h3>
            <p className="text-muted-foreground mb-4">Start watching to build your history!</p>
            <Button onClick={() => navigate("/")}>Browse Content</Button>
          </div>
        )}
      </div>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedItem ? "Remove from Watch History" : "Clear Watch History"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedItem
                ? `Are you sure you want to remove "${selectedItem.title}" from your watch history?`
                : "Are you sure you want to clear your entire watch history? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={selectedItem ? confirmRemoveFromHistory : confirmClearHistory}
              className="bg-destructive hover:bg-destructive/90"
            >
              {selectedItem ? "Remove" : "Clear All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}

export default WatchHistoryPage;
