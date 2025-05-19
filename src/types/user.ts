import { Timestamp } from 'firebase/firestore';

export interface UserSettings {
  defaultSource: string;
  preferredQuality: string;
  preferredSubtitle: string;
  autoplayEnabled: boolean;
  mutedAutoplay: boolean;
}

export interface WatchHistoryItem {
  id: number;
  title: string;
  poster_path: string;
  media_type: string;
  progress: number;
  lastWatched: string;
  season?: number;
  episode?: number;
}

export interface FavoriteItem {
  id: number;
  media_type: 'movie' | 'tv' | 'anime';
}

export interface WatchLaterItem {
  id: number;
  media_type: 'movie' | 'tv' | 'anime';
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  favorites: FavoriteItem[];
  watchLater: WatchLaterItem[];
  watchHistory: WatchHistoryItem[];
  settings?: UserSettings;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface CustomList {
  id: string;
  userId: string;
  name: string;
  description: string;
  items: {
    id: number;
    title: string;
    poster_path: string;
    media_type: string;
  }[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
