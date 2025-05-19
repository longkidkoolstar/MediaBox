
import { useState, useEffect } from "react";
import { Layout } from "../components/Layout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  User as UserIcon,
  Settings,
  Heart,
  Play,
  History,
  LogOut,
  Edit,
  Save,
  Loader2
} from "lucide-react";
import { MediaGrid } from "../components/MediaGrid";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { signOutUser } from "../services/authService";
import { updateUserProfile } from "../services/userService";
import { useNavigate } from "react-router-dom";
import { useMediaLists } from "../hooks/useMediaLists";

export function ProfilePage() {
  const { userData, refreshUserData, isLoading: authLoading } = useAuth();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedUsername, setEditedUsername] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();
  const { favoriteItems, isLoadingFavorites } = useMediaLists();

  useEffect(() => {
    if (userData) {
      setEditedUsername(userData.username);
    }
  }, [userData]);

  const handleSaveProfile = async () => {
    if (!userData) return;

    setIsUpdating(true);
    try {
      await updateUserProfile(userData.id, { username: editedUsername });
      await refreshUserData();
      setIsEditingProfile(false);
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error: any) {
      console.error("Error logging out:", error);
      toast.error(error.message || "Failed to log out");
    }
  };

  const formatLastWatched = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isLoading = authLoading || isLoadingFavorites;

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold">Loading profile...</h2>
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
            <h2 className="text-xl font-semibold mb-4">You need to be logged in to view this page</h2>
            <Button onClick={() => navigate("/login")}>Sign In</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Profile Sidebar */}
          <div className="w-full md:w-1/4 space-y-6">
            <div className="bg-card rounded-lg p-6 text-center space-y-4 border border-border">
              <div className="relative w-32 h-32 mx-auto">
                <img
                  src={userData.avatar}
                  alt={userData.username}
                  className="rounded-full w-32 h-32 object-cover"
                />
                <button className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full">
                  <Edit className="h-4 w-4" />
                </button>
              </div>

              {isEditingProfile ? (
                <div>
                  <Input
                    value={editedUsername}
                    onChange={(e) => setEditedUsername(e.target.value)}
                    className="mb-2"
                  />
                  <div className="flex space-x-2 justify-center">
                    <Button size="sm" onClick={handleSaveProfile} disabled={isUpdating}>
                      {isUpdating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </>
                      )}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditingProfile(false)} disabled={isUpdating}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold">{userData.username}</h2>
                  <p className="text-muted-foreground">{userData.email}</p>
                  <Button onClick={() => setIsEditingProfile(true)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit Profile
                  </Button>
                </>
              )}
            </div>

            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold">Account</h3>
              </div>

              <div className="space-y-1 p-2">
                <Button variant="ghost" className="w-full justify-start" onClick={() => navigate("/profile")}>
                  <UserIcon className="h-4 w-4 mr-2" />
                  Profile
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => navigate("/settings")}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => navigate("/favorites")}>
                  <Heart className="h-4 w-4 mr-2" />
                  Favorites
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => navigate("/watch-history")}>
                  <History className="h-4 w-4 mr-2" />
                  Watch History
                </Button>
                <Button variant="ghost" className="w-full justify-start text-destructive" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Log Out
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="w-full md:w-3/4">
            <h1 className="text-3xl font-bold mb-6">My Profile</h1>

            <Tabs defaultValue="favorites">
              <TabsList className="mb-6">
                <TabsTrigger value="favorites">Favorites</TabsTrigger>
                <TabsTrigger value="watch-history">Watch History</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="favorites">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">My Favorites</h2>
                  {favoriteItems.length > 5 && (
                    <Button variant="outline" onClick={() => navigate("/favorites")}>
                      View All
                    </Button>
                  )}
                </div>

                {favoriteItems.length > 0 ? (
                  <div>
                    <MediaGrid items={favoriteItems.slice(0, 5)} />

                    {favoriteItems.length > 5 && (
                      <div className="mt-6 text-center">
                        <p className="text-muted-foreground mb-3">
                          Showing 5 of {favoriteItems.length} favorites
                        </p>
                        <Button onClick={() => navigate("/favorites")}>
                          View All Favorites
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-card border border-border rounded-lg">
                    <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No favorites yet</h3>
                    <p className="text-muted-foreground mb-4">Start adding your favorite movies, TV shows, and anime!</p>
                    <Button onClick={() => navigate("/")}>Browse Content</Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="watch-history">
                <h2 className="text-xl font-semibold mb-4">Watch History</h2>

                {userData.watchHistory && userData.watchHistory.length > 0 ? (
                  <div className="space-y-4">
                    {userData.watchHistory.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 border border-border rounded-lg p-4">
                        <img
                          src={`https://image.tmdb.org/t/p/w200${item.poster_path}`}
                          alt={item.title}
                          className="w-16 h-24 rounded-md object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium">{item.title}</h3>
                          <p className="text-sm text-muted-foreground">{item.media_type === "movie" ? "Movie" : item.media_type === "tv" ? "TV Show" : "Anime"}</p>
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
                        <div>
                          <Button size="sm" asChild>
                            <a href={`/${item.media_type}/${item.id}/watch${item.season && item.episode ? `?season=${item.season}&episode=${item.episode}` : ''}`}>
                              <Play className="h-4 w-4" />
                            </a>
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
              </TabsContent>

              <TabsContent value="settings">
                <h2 className="text-xl font-semibold mb-4">Settings</h2>

                <div className="space-y-6">
                  <div className="bg-card border border-border rounded-lg p-6">
                    <h3 className="text-lg font-medium mb-4">Account Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <Input value={userData.email} disabled />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Username</label>
                        <Input
                          value={editedUsername}
                          onChange={(e) => setEditedUsername(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <Input type="password" value="********" disabled />
                        <p className="text-xs text-muted-foreground mt-1">
                          To change your password, log out and use the "Forgot password" option on the login page.
                        </p>
                      </div>
                      <Button onClick={handleSaveProfile} disabled={isUpdating}>
                        {isUpdating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            Updating Account...
                          </>
                        ) : (
                          "Update Account"
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-6">
                    <h3 className="text-lg font-medium mb-4">Preferences</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Autoplay next episode</h4>
                          <p className="text-sm text-muted-foreground">
                            Automatically play the next episode in a series
                          </p>
                        </div>
                        <Button variant="outline">
                          {userData.settings?.autoplayEnabled ? "Enabled" : "Disabled"}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Default video quality</h4>
                          <p className="text-sm text-muted-foreground">
                            Set the default quality for video playback
                          </p>
                        </div>
                        <Button variant="outline">
                          {userData.settings?.preferredQuality || "1080p"}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Subtitle language</h4>
                          <p className="text-sm text-muted-foreground">
                            Set your preferred subtitle language
                          </p>
                        </div>
                        <Button variant="outline">
                          {userData.settings?.preferredSubtitle || "English"}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Default video source</h4>
                          <p className="text-sm text-muted-foreground">
                            Set your preferred video source
                          </p>
                        </div>
                        <Button variant="outline">
                          {userData.settings?.defaultSource || "vidsrc.dev"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default ProfilePage;
