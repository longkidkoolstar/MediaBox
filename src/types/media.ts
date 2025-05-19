export interface MediaItem {
  id: number;
  title: string;
  poster_path: string;
  backdrop_path?: string;
  vote_average: number;
  media_type: 'movie' | 'tv' | 'anime';
  release_date?: string;
  first_air_date?: string;
  overview?: string;
}

export interface MovieDetails extends MediaItem {
  media_type: 'movie';
  tagline?: string;
  runtime?: number;
  genres?: string[];
  videos?: {
    name: string;
    key: string;
    site: string;
    type: string;
  }[];
  credits?: {
    cast: {
      id: number;
      name: string;
      character: string;
      profile_path: string;
    }[];
    crew: {
      id: number;
      name: string;
      job: string;
      profile_path: string;
    }[];
  };
  similar?: MediaItem[];
  recommendations?: MediaItem[];
}

export interface TVEpisode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  still_path: string;
  air_date?: string;
  runtime?: number;
}

export interface TVSeason {
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  season_number: number;
  episode_count: number;
  episodes?: TVEpisode[];
}

export interface TVShowDetails extends MediaItem {
  media_type: 'tv' | 'anime';
  tagline?: string;
  genres?: string[];
  seasons?: TVSeason[];
  videos?: {
    name: string;
    key: string;
    site: string;
    type: string;
  }[];
  credits?: {
    cast: {
      id: number;
      name: string;
      character: string;
      profile_path: string;
    }[];
    crew: {
      id: number;
      name: string;
      job: string;
      profile_path: string;
    }[];
  };
  similar?: MediaItem[];
  recommendations?: MediaItem[];
}

export interface VideoSource {
  name: string;
  url: string;
}
