# MediaBox Backend Implementation

This document provides instructions for setting up and deploying the MediaBox backend using Firebase.

## Overview

The MediaBox backend is built with Firebase and includes:

- **Authentication**: Email/password, Google, and Facebook login
- **Firestore Database**: User data, favorites, watch history, and custom lists
- **Security Rules**: Secure access to Firestore data
- **TMDB API Integration**: Movie, TV show, and anime data with caching
- **Video Source Integration**: Dynamic URL generation for multiple video providers

## Setup Instructions

### 1. Firebase Setup

1. Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Enable Authentication with Email/Password, Google, and Facebook providers
3. Create a Firestore database
4. Deploy the Firestore security rules from `firestore.rules`

### 2. Authentication Configuration

1. In the Firebase console, go to Authentication > Sign-in method
2. Enable Email/Password authentication
3. Enable Google authentication
4. For Facebook authentication:
   - Create a Facebook Developer account and app
   - Configure Facebook Login
   - Add the OAuth redirect URI from Firebase
   - Copy the App ID and App Secret to Firebase

### 3. Firestore Database Structure

The database has the following collections:

- **users**: User profiles, favorites, and watch history
- **lists**: Custom user-created lists
- **tmdb_cache**: Cached responses from TMDB API

### 4. Deploy Firestore Security Rules

```bash
firebase deploy --only firestore:rules
```

## Backend Services

### Authentication Service (`src/services/authService.ts`)

Handles user authentication with Firebase Authentication:

- Email/password registration and login
- Google and Facebook social login
- Password reset
- User profile management

### User Service (`src/services/userService.ts`)

Manages user data in Firestore:

- User profiles
- Favorites
- Watch history
- Custom lists

### TMDB Service (`src/services/tmdbService.ts`)

Interacts with the TMDB API with caching:

- Trending movies, TV shows, and anime
- Movie and TV show details
- Search functionality
- Genre listings

### Video Source Service (`src/services/videoSourceService.ts`)

Generates embed URLs for various video providers:

- vidsrc.dev
- 2embed
- 2embed.cc
- vidsrc.xyz
- vidsrc.to

## React Hooks

The backend provides several custom hooks:

- **useAuth**: Authentication state management
- **useFavorites**: Add/remove favorites
- **useWatchHistory**: Track watch progress
- **useUserSettings**: User preferences
- **useTMDB**: TMDB API data fetching
- **useVideoSources**: Video source URL generation

## Deployment

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project:
   ```bash
   firebase init
   ```

4. Deploy to Firebase:
   ```bash
   firebase deploy
   ```

## Environment Variables

For production, consider moving sensitive information to environment variables:

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
VITE_TMDB_API_KEY=your-tmdb-api-key
```

## Security Considerations

1. Implement rate limiting for API calls
2. Set up Firebase App Check for additional security
3. Regularly audit Firestore security rules
4. Monitor authentication activity for suspicious behavior
5. Implement proper error handling and logging

## Maintenance

1. Regularly update Firebase dependencies
2. Monitor TMDB API changes
3. Check for changes in video source providers
4. Backup Firestore data regularly
