import { useState } from "react";
import { Layout } from "../components/Layout";
import { Button } from "../components/ui/button";
import { Clock, Loader2, Trash2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useWatchLater } from "../hooks/useWatchLater";
import { MediaGrid } from "../components/MediaGrid";
import { useMediaLists } from "../hooks/useMediaLists";
import { MediaItem } from "../types/media";
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

export function WatchLaterPage() {
  const { userData, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { clearAllWatchLater, isProcessing } = useWatchLater();
  const { watchLaterItems, isLoadingWatchLater } = useMediaLists();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleClearWatchLater = () => {
    setIsDialogOpen(true);
  };

  const confirmClearWatchLater = async () => {
    await clearAllWatchLater();
    setIsDialogOpen(false);
  };

  const isLoading = authLoading || isLoadingWatchLater;

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold">Loading watch later list...</h2>
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
            <h2 className="text-xl font-semibold mb-4">You need to be logged in to view your watch later list</h2>
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
          <h1 className="text-3xl font-bold">Watch Later</h1>
          {watchLaterItems.length > 0 && (
            <Button variant="outline" onClick={handleClearWatchLater} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear List
                </>
              )}
            </Button>
          )}
        </div>

        {watchLaterItems.length > 0 ? (
          <MediaGrid items={watchLaterItems as MediaItem[]} />
        ) : (
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Your watch later list is empty</h3>
            <p className="text-muted-foreground mb-4">Save movies, TV shows, and anime to watch later!</p>
            <Button onClick={() => navigate("/")}>Browse Content</Button>
          </div>
        )}
      </div>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Watch Later List</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear your entire watch later list? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmClearWatchLater}
              className="bg-destructive hover:bg-destructive/90"
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}

export default WatchLaterPage;
