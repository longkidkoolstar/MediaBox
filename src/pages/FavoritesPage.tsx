import { useState } from "react";
import { Layout } from "../components/Layout";
import { Button } from "../components/ui/button";
import { Heart, Loader2, Trash2 } from "lucide-react";
import { MediaCard } from "../components/MediaCard";
import { MediaGrid } from "../components/MediaGrid";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useFavorites } from "../hooks/useFavorites";
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
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";

export function FavoritesPage() {
  const { userData, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toggleFavorite, isProcessing } = useFavorites();
  const { favoriteItems, isLoadingFavorites } = useMediaLists();
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleRemoveFavorite = (item: MediaItem) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
  };

  const confirmRemoveFavorite = async () => {
    if (!selectedItem) return;

    await toggleFavorite(
      selectedItem.id,
      selectedItem.title || selectedItem.name || "",
      selectedItem.media_type
    );
    setIsDialogOpen(false);
    toast.success(`Removed "${selectedItem.title || selectedItem.name}" from favorites`);
  };

  const isLoading = authLoading || isLoadingFavorites;

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold">Loading favorites...</h2>
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
            <h2 className="text-xl font-semibold mb-4">You need to be logged in to view your favorites</h2>
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
          <h1 className="text-3xl font-bold">My Favorites</h1>
        </div>

        {favoriteItems.length > 0 ? (
          <div className="relative">
            <MediaGrid items={favoriteItems} />
            {/* Add remove buttons on top of the MediaGrid */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 py-6">
                {favoriteItems.map((item) => (
                  <div key={`${item.id}-${item.media_type}`} className="relative group h-full">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleRemoveFavorite(item);
                      }}
                      className="absolute top-2 right-2 bg-black/70 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto z-20"
                      disabled={isProcessing}
                    >
                      <Trash2 className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No favorites yet</h3>
            <p className="text-muted-foreground mb-4">Start adding your favorite movies, TV shows, and anime!</p>
            <Button onClick={() => navigate("/")}>Browse Content</Button>
          </div>
        )}
      </div>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Favorites</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{selectedItem?.title || selectedItem?.name}" from your favorites?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveFavorite}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}

export default FavoritesPage;
