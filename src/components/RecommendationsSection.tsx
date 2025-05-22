import React, { useEffect } from 'react';
import { useRecommendations } from '../hooks/useRecommendations';
import { MediaCard } from './MediaCard';
import { Button } from './ui/button';
import { RefreshCw, Loader2, ThumbsUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Skeleton } from './ui/skeleton';

interface RecommendationsSectionProps {
  title?: string;
  showRefreshButton?: boolean;
}

export function RecommendationsSection({
  title = 'Recommended for You',
  showRefreshButton = true
}: RecommendationsSectionProps) {
  const { currentUser, userData, isAuthenticated, refreshUserData } = useAuth();
  const { recommendations, isLoading, refreshRecommendations } = useRecommendations();

  // Try to refresh user data if authenticated but no userData
  useEffect(() => {
    if (currentUser && isAuthenticated && !userData) {
      refreshUserData();
    }
  }, [currentUser, isAuthenticated, userData, refreshUserData]);

  if (!isAuthenticated || !currentUser || !userData) {
    // Different message if user is logged in but userData is missing
    if (currentUser && isAuthenticated && !userData) {
      return (
        <div className="py-8">
          <h2 className="text-2xl font-bold mb-4">{title}</h2>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 text-center">
            <Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
            <p className="mb-4 text-lg">Loading your profile data...</p>
            <p className="text-muted-foreground mb-6">This may take a moment. If it persists, try refreshing.</p>
            <Button onClick={refreshUserData} className="font-medium">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Profile Data
            </Button>
          </div>
        </div>
      );
    }

    // Standard sign-in prompt
    return (
      <div className="py-8">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 text-center">
          <ThumbsUp className="h-12 w-12 mx-auto mb-4 text-primary opacity-70" />
          <p className="mb-4 text-lg">Sign in to get personalized recommendations based on your watch history and favorites.</p>
          <Link to="/login">
            <Button size="lg" className="font-medium">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading && recommendations.length === 0) {
    return (
      <div className="py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[2/3] rounded-lg w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{title}</h2>
          {showRefreshButton && (
            <Button variant="outline" onClick={refreshRecommendations} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Refresh
            </Button>
          )}
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8 text-center">
          <ThumbsUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg mb-4">No recommendations available yet.</p>
          <p className="text-muted-foreground mb-6">Watch some content or add favorites to get personalized recommendations.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={refreshRecommendations} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Generate Recommendations
            </Button>
            <Button variant="outline" onClick={refreshUserData}>
              Refresh Profile Data
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">{title}</h2>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        <div className="flex gap-2">
          {showRefreshButton && (
            <Button variant="outline" onClick={refreshRecommendations} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Refresh Recommendations
            </Button>
          )}
          <Button variant="ghost" onClick={refreshUserData} size="icon" title="Refresh Profile Data">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {recommendations.map((media) => (
          <MediaCard key={`${media.media_type}-${media.id}`} item={media} />
        ))}
      </div>
    </div>
  );
}

export default RecommendationsSection;
