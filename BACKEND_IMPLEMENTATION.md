# MediaBox Backend Implementation Guide

This guide provides detailed instructions for setting up and deploying the MediaBox backend using Firebase. The implementation replaces the previous jsonstorage.net storage with a professional Firebase backend while preserving the required video source integration logic.

## Table of Contents

1. [Overview](#overview)
2. [Firebase Setup](#firebase-setup)
3. [Backend Services](#backend-services)
4. [Data Migration](#data-migration)
5. [React Hooks](#react-hooks)
6. [Security](#security)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

## Overview

The MediaBox backend is built with Firebase and includes:

- **Authentication**: Email/password, Google, and Facebook login
- **Firestore Database**: User data, favorites, watch history, and custom lists
- **Security Rules**: Secure access to Firestore data
- **TMDB API Integration**: Movie, TV show, and anime data with caching
- **Video Source Integration**: Dynamic URL generation for multiple video providers
- **Recommendation System**: Personalized content recommendations based on watch history

## Firebase Setup

### 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter a project name (e.g., "MediaBox")
4. Choose whether to enable Google Analytics (recommended)
5. Follow the prompts to complete project creation

### 2. Register Your Web App

1. In the Firebase Console, click on your project
2. Click the web icon (</>) to add a web app
3. Register your app with a nickname (e.g., "MediaBox Web")
4. Check "Also set up Firebase Hosting" if you plan to use it
5. Click "Register app"
6. Copy the Firebase configuration object for later use

### 3. Set Up Authentication

1. In the Firebase Console, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Enable the following sign-in methods:
   - Email/Password
   - Google
   - Facebook (requires additional setup with Facebook Developer account)

### 4. Create Firestore Database

1. In the Firebase Console, go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" for development (you'll update security rules later)
4. Select a location for your database (choose one close to your users)
5. Click "Enable"

### 5. Deploy Firestore Security Rules

1. In the Firebase Console, go to "Firestore Database"
2. Click on the "Rules" tab
3. Replace the default rules with the content from your `firestore.rules` file
4. Click "Publish"

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

### Recommendation Service (`src/services/recommendationService.ts`)

Generates personalized recommendations based on user activity:

- Analyzes watch history and favorites
- Identifies genre preferences
- Provides content recommendations

## Data Migration

To migrate user data from jsonstorage.net to Firebase:

### Using the Admin Page

1. Navigate to `/admin` in your application
2. Enter your jsonstorage.net bin ID
3. Click "Start Migration"
4. Monitor the migration progress

### Using the Command Line Script

1. Install dependencies:
   ```bash
   npm install node-fetch firebase
   ```

2. Run the migration script:
   ```bash
   node scripts/migrate-data.js <jsonstorage-bin-id>
   ```

## React Hooks

The backend provides several custom hooks:

### `useAuth` Hook

Authentication state management:
- User login/logout state
- User profile data
- Authentication methods

### `useFavorites` Hook

Manage user favorites:
- Check if media is in favorites
- Add/remove favorites
- Handle loading and error states

### `useWatchHistory` Hook

Track watch progress:
- Get watch progress for media
- Update progress
- Remove from history

### `useUserSettings` Hook

Manage user preferences:
- Default video source
- Preferred quality
- Autoplay settings

### `useTMDB` Hook

TMDB API data fetching:
- Trending content
- Media details
- Search functionality

### `useVideoSources` Hook

Video source URL generation:
- Generate URLs for different providers
- Handle provider preferences

### `useRecommendations` Hook

Personalized recommendations:
- Get recommendations based on watch history
- Refresh recommendations
- Handle loading and error states

## Security

### Firestore Security Rules

The `firestore.rules` file implements the following security:

- Users can only read and write their own data
- Users cannot delete their accounts through the client
- Custom lists are protected by user ID
- TMDB cache is readable by anyone but only writable by authenticated users
- Recommendations are read-only for users

## Deployment

### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Login to Firebase

```bash
firebase login
```

### 3. Initialize Firebase in Your Project

```bash
firebase init
```

Select the following features:
- Firestore
- Hosting (if you plan to deploy your app)
- Storage (if you're using Firebase Storage)

### 4. Build Your Application

```bash
npm run build
```

### 5. Deploy to Firebase

```bash
firebase deploy
```

## Troubleshooting

### Authentication Issues

1. **Email/Password Provider Not Enabled**: Make sure you've enabled the Email/Password provider in the Firebase Authentication settings.

2. **Social Login Issues**: For Google and Facebook login, ensure you've completed all the setup steps, including configuring the OAuth redirect URI.

3. **Domain Verification**: For production, you may need to verify your domain in the Firebase Authentication settings.

### Firestore Access Issues

1. **400 (Bad Request) Error**: Ensure your Firebase configuration matches your project settings.

2. **Permission Denied**: Check your Firestore security rules to ensure they allow the operations you're trying to perform.

3. **Missing Indexes**: If you see an error about missing indexes, follow the link in the error message to create the required indexes.

### Video Source Integration Issues

1. **URL Generation Errors**: Check that the TMDB ID to IMDb ID conversion is working correctly.

2. **Embedding Issues**: Verify that the generated URLs match the format required by each provider.

3. **CORS Issues**: Some providers may have CORS restrictions. Consider using a proxy if needed.

### Recommendation System Issues

1. **No Recommendations**: Users need to have watch history or favorites for the recommendation system to work.

2. **Slow Recommendations**: The recommendation system may be slow for users with extensive watch history. Consider implementing pagination or limiting the number of items analyzed.
