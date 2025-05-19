import React from 'react';
import { useRecommendations } from '../hooks/useRecommendations';
import { MediaCard } from './MediaCard';
import { Button } from './ui/button';
import { RefreshCw, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

interface RecommendationsSectionProps {
  title?: string;
  showRefreshButton?: boolean;
}

export function RecommendationsSection({
  title = 'Recommended for You',
  showRefreshButton = true
}: RecommendationsSectionProps) {
  const { isAuthenticated } = useAuth();
  const { recommendations, isLoading, refreshRecommendations } = useRecommendations();

  if (!isAuthenticated) {
    return (
      <div className="py-8">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 text-center">
          <p className="mb-4">Sign in to get personalized recommendations based on your watch history.</p>
          <Link to="/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading && recommendations.length === 0) {
    return (
      <div className="py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">{title}</h2>
          {showRefreshButton && (
            <Button variant="outline" onClick={refreshRecommendations} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Refresh
            </Button>
          )}
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 text-center">
          <p>No recommendations available. Watch some content to get personalized recommendations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        {showRefreshButton && (
          <Button variant="outline" onClick={refreshRecommendations} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {recommendations.map((media) => (
          <MediaCard key={`${media.media_type}-${media.id}`} media={media} />
        ))}
      </div>
    </div>
  );
}

export default RecommendationsSection;
