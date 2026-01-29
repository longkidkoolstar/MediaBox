import { useState } from "react";
import { Layout } from "../components/Layout";
import { Button } from "../components/ui/button";
import { Clock, Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useWatchList } from "../hooks/useWatchList";
import { MediaGrid } from "../components/MediaGrid";
import { useMediaLists } from "../hooks/useMediaLists";
import { MediaItem } from "../types/media";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";

export function WatchListPage() {
  const { userData, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { getWatchStatus } = useWatchList();
  const { watchlistItems, isLoadingWatchlist } = useMediaLists();
  const [activeTab, setActiveTab] = useState<string>("all");

  const isLoading = authLoading || isLoadingWatchlist;

  const getFilteredItems = (status: string) => {
    if (status === "all") return watchlistItems;
    
    return watchlistItems.filter(item => {
      const itemStatus = getWatchStatus(item.id, item.media_type as any);
      return itemStatus === status;
    });
  };

  const tabs = [
    { id: "all", label: "All" },
    { id: "watching", label: "Watching" },
    { id: "on-hold", label: "On Hold" },
    { id: "plan_to_watch", label: "Plan to Watch" },
    { id: "dropped", label: "Dropped" },
    { id: "completed", label: "Completed" },
  ];

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold">Loading watchlist...</h2>
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
            <h2 className="text-xl font-semibold mb-4">You need to be logged in to view your watchlist</h2>
            <Button onClick={() => navigate("/login")}>Sign In</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const activeItems = getFilteredItems(activeTab);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Watchlist</h1>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="flex flex-wrap h-auto p-1 w-full justify-start">
            {tabs.map(tab => (
              <TabsTrigger key={tab.id} value={tab.id} className="flex-1 min-w-[100px]">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {activeItems.length > 0 ? (
          <MediaGrid items={activeItems as MediaItem[]} />
        ) : (
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {activeTab === "all" ? "Your watchlist is empty" : `No items in ${tabs.find(t => t.id === activeTab)?.label}`}
            </h3>
            <p className="text-muted-foreground mb-4">
              {activeTab === "all" 
                ? "Save movies, TV shows, and anime to your watchlist!" 
                : "Move items here to track your progress!"}
            </p>
            <Button onClick={() => navigate("/")}>Browse Content</Button>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default WatchListPage;
