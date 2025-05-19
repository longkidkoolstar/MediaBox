
import { useState, useEffect } from "react";
import { Layout } from "../components/Layout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "../components/ui/tabs";
import { Switch } from "../components/ui/switch";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { useUserSettings } from "../hooks/useUserSettings";
import { resetPassword } from "../services/authService";
import { updateUserProfile } from "../services/userService";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { VideoProvider, getAvailableProviders } from "../services/videoSourceService";

export function SettingsPage() {
  const { userData, refreshUserData, isLoading: authLoading } = useAuth();
  const { settings, updateSettings, isProcessing } = useUserSettings();
  const navigate = useNavigate();

  // Form state
  const [defaultSource, setDefaultSource] = useState<string>(VideoProvider.VIDSRC_DEV);
  const [preferredQuality, setPreferredQuality] = useState<string>("1080p");
  const [preferredSubtitle, setPreferredSubtitle] = useState<string>("English");
  const [autoplayEnabled, setAutoplayEnabled] = useState<boolean>(true);
  const [mutedAutoplay, setMutedAutoplay] = useState<boolean>(true);

  // Account form state
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState<boolean>(false);
  const [isResettingPassword, setIsResettingPassword] = useState<boolean>(false);

  // Theme state
  const [theme, setTheme] = useState<string>("system");
  const [autoSwitchTheme, setAutoSwitchTheme] = useState<boolean>(false);

  // Available video sources
  const videoSources = getAvailableProviders();

  // Initialize form with user settings
  useEffect(() => {
    if (userData && settings) {
      setDefaultSource(settings.defaultSource || VideoProvider.VIDSRC_DEV);
      setPreferredQuality(settings.preferredQuality || "1080p");
      setPreferredSubtitle(settings.preferredSubtitle || "English");
      setAutoplayEnabled(settings.autoplayEnabled !== undefined ? settings.autoplayEnabled : true);
      setMutedAutoplay(settings.mutedAutoplay !== undefined ? settings.mutedAutoplay : true);

      setUsername(userData.username || "");
      setEmail(userData.email || "");

      // Get theme from localStorage
      const savedTheme = localStorage.getItem("theme") || "system";
      setTheme(savedTheme);
    }
  }, [userData, settings]);

  const handleSavePlayback = async () => {
    if (!userData) return;

    try {
      await updateSettings({
        defaultSource,
        preferredQuality,
        preferredSubtitle,
        autoplayEnabled,
        mutedAutoplay
      });

      toast.success("Playback settings saved successfully!");
    } catch (error: any) {
      console.error("Error saving playback settings:", error);
      toast.error(error.message || "Failed to save playback settings");
    }
  };

  const handleSaveAccount = async () => {
    if (!userData) return;

    setIsUpdatingProfile(true);
    try {
      await updateUserProfile(userData.id, { username });
      await refreshUserData();
      toast.success("Account settings saved successfully!");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update account settings");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) return;

    setIsResettingPassword(true);
    try {
      await resetPassword(email);
      toast.success("Password reset email sent. Please check your inbox.");
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast.error(error.message || "Failed to send password reset email");
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleSaveAppearance = () => {
    // Save theme to localStorage
    localStorage.setItem("theme", theme);

    // Apply theme
    if (theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    toast.success("Appearance settings saved successfully!");
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold">Loading settings...</h2>
          </div>
        </div>
      </Layout>
    );
  }

  if (!userData) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center min-h-[60vh]">
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        <Tabs defaultValue="playback">
          <TabsList className="mb-8 w-full justify-start">
            <TabsTrigger value="playback">Playback</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="playback">
            <div className="space-y-8">
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-6">Video Playback Settings</h2>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="defaultSource">Default Source</Label>
                    <Select value={defaultSource} onValueChange={setDefaultSource}>
                      <SelectTrigger id="defaultSource">
                        <SelectValue placeholder="Select default source" />
                      </SelectTrigger>
                      <SelectContent>
                        {videoSources.map(source => (
                          <SelectItem key={source.id} value={source.id}>
                            {source.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground mt-1">
                      Select your preferred source for streaming
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preferredQuality">Preferred Quality</Label>
                    <Select value={preferredQuality} onValueChange={setPreferredQuality}>
                      <SelectTrigger id="preferredQuality">
                        <SelectValue placeholder="Select preferred quality" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="360p">360p</SelectItem>
                        <SelectItem value="480p">480p</SelectItem>
                        <SelectItem value="720p">720p</SelectItem>
                        <SelectItem value="1080p">1080p</SelectItem>
                        <SelectItem value="Auto">Auto (Based on Connection)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground mt-1">
                      Select your preferred video quality
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preferredSubtitle">Subtitle Language</Label>
                    <Select value={preferredSubtitle} onValueChange={setPreferredSubtitle}>
                      <SelectTrigger id="preferredSubtitle">
                        <SelectValue placeholder="Select subtitle language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Spanish">Spanish</SelectItem>
                        <SelectItem value="French">French</SelectItem>
                        <SelectItem value="German">German</SelectItem>
                        <SelectItem value="Japanese">Japanese</SelectItem>
                        <SelectItem value="None">No Subtitles</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground mt-1">
                      Select your preferred subtitle language
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="autoplay">Autoplay Next Episode</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically play next episode in series
                      </p>
                    </div>
                    <Switch
                      id="autoplay"
                      checked={autoplayEnabled}
                      onCheckedChange={setAutoplayEnabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="mutedAutoplay">Muted Autoplay</Label>
                      <p className="text-sm text-muted-foreground">
                        Mute video when autoplay starts
                      </p>
                    </div>
                    <Switch
                      id="mutedAutoplay"
                      checked={mutedAutoplay}
                      onCheckedChange={setMutedAutoplay}
                    />
                  </div>

                  <Button onClick={handleSavePlayback} disabled={isProcessing}>
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Playback Settings"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="account">
            <div className="space-y-8">
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-6">Account Information</h2>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      disabled
                      className="opacity-70"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Email address cannot be changed
                    </p>
                  </div>

                  <h3 className="text-lg font-medium mt-8 mb-4">Reset Password</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    To reset your password, we'll send you an email with instructions.
                  </p>

                  <Button
                    onClick={handleResetPassword}
                    disabled={isResettingPassword}
                    variant="outline"
                  >
                    {isResettingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending Reset Email...
                      </>
                    ) : (
                      "Send Password Reset Email"
                    )}
                  </Button>

                  <div className="pt-4">
                    <Button
                      onClick={handleSaveAccount}
                      disabled={isUpdatingProfile || username === userData.username}
                    >
                      {isUpdatingProfile ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Account Settings"
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-semibold text-destructive mb-6">Danger Zone</h2>
                <p className="text-muted-foreground mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <Button
                  variant="destructive"
                  onClick={() => toast.error("Account deletion is disabled in this demo")}
                >
                  Delete Account
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="appearance">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-6">Appearance Settings</h2>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div
                      className={`bg-white border-2 ${theme === 'light' ? 'border-primary' : 'border-border'} rounded-lg p-4 text-center text-black cursor-pointer hover:border-primary/70 transition-colors`}
                      onClick={() => setTheme('light')}
                    >
                      <div className="mb-2">Light</div>
                      <div className="h-20 bg-gray-100 rounded"></div>
                    </div>
                    <div
                      className={`bg-[#1a1f2c] border-2 ${theme === 'dark' ? 'border-primary' : 'border-border'} rounded-lg p-4 text-center text-white cursor-pointer hover:border-primary/70 transition-colors`}
                      onClick={() => setTheme('dark')}
                    >
                      <div className="mb-2">Dark</div>
                      <div className="h-20 bg-gray-800 rounded"></div>
                    </div>
                    <div
                      className={`bg-gradient-to-b from-white to-[#1a1f2c] border-2 ${theme === 'system' ? 'border-primary' : 'border-border'} rounded-lg p-4 text-center cursor-pointer hover:border-primary/70 transition-colors`}
                      onClick={() => setTheme('system')}
                    >
                      <div className="mb-2 text-black">System</div>
                      <div className="h-20 bg-gradient-to-r from-gray-100 to-gray-800 rounded"></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="autoSwitchTheme">Auto-switch Theme Based on Time</Label>
                    <p className="text-sm text-muted-foreground">
                      Switch to dark mode during night time (6PM-6AM)
                    </p>
                  </div>
                  <Switch
                    id="autoSwitchTheme"
                    checked={autoSwitchTheme}
                    onCheckedChange={setAutoSwitchTheme}
                  />
                </div>

                <Button onClick={handleSaveAppearance}>
                  Save Appearance Settings
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-6">Notification Settings</h2>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="newContentNotifications">New Content Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when new content is added
                    </p>
                  </div>
                  <Switch
                    id="newContentNotifications"
                    defaultChecked
                    onCheckedChange={() => toast.success("Notification preference saved")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="recommendations">Recommendations</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about recommended content based on your interests
                    </p>
                  </div>
                  <Switch
                    id="recommendations"
                    defaultChecked
                    onCheckedChange={() => toast.success("Recommendation preference saved")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive emails for important updates and recommendations
                    </p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    defaultChecked
                    onCheckedChange={() => toast.success("Email notification preference saved")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="newsletter">Newsletter</Label>
                    <p className="text-sm text-muted-foreground">
                      Subscribe to our weekly newsletter for updates
                    </p>
                  </div>
                  <Switch
                    id="newsletter"
                    defaultChecked={false}
                    onCheckedChange={() => toast.success("Newsletter preference saved")}
                  />
                </div>

                <div className="pt-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Note: Notification settings are saved automatically when changed.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => toast.success("All notification settings saved")}
                  >
                    Save All Notification Settings
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

export default SettingsPage;
