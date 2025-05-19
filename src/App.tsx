
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { initAnalytics } from "./lib/firebase";

// Lazy load pages for better performance
const HomePage = lazy(() => import("./pages/HomePage"));
const MoviesPage = lazy(() => import("./pages/MoviesPage"));
const TVShowsPage = lazy(() => import("./pages/TVShowsPage"));
const AnimePage = lazy(() => import("./pages/AnimePage"));
const MediaDetailPage = lazy(() => import("./pages/MediaDetailPage"));
const SeasonPage = lazy(() => import("./pages/SeasonPage"));
const WatchPage = lazy(() => import("./pages/WatchPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const FavoritesPage = lazy(() => import("./pages/FavoritesPage"));
const WatchLaterPage = lazy(() => import("./pages/WatchLaterPage"));
const WatchHistoryPage = lazy(() => import("./pages/WatchHistoryPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Create a loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

// Create protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return <PageLoader />;
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

const App = () => {
  // Set up dark mode based on user preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Initialize Firebase Analytics
    initAnalytics();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/movies" element={<MoviesPage />} />
                <Route path="/tv" element={<TVShowsPage />} />
                <Route path="/anime" element={<AnimePage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/:mediaType/:id" element={<MediaDetailPage />} />
                <Route path="/:mediaType/:id/season/:seasonNumber" element={<SeasonPage />} />
                <Route path="/:mediaType/:id/watch" element={<WatchPage />} />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/favorites"
                  element={
                    <ProtectedRoute>
                      <FavoritesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/watch-history"
                  element={
                    <ProtectedRoute>
                      <WatchHistoryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/watch-later"
                  element={
                    <ProtectedRoute>
                      <WatchLaterPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <AdminPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
