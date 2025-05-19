# Firebase Setup Guide for MediaBox

This guide will help you set up Firebase for your MediaBox streaming platform.

## 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter a project name (e.g., "MediaBox")
4. Choose whether to enable Google Analytics (recommended)
5. Follow the prompts to complete project creation

## 2. Register Your Web App

1. In the Firebase Console, click on your project
2. Click the web icon (</>) to add a web app
3. Register your app with a nickname (e.g., "MediaBox Web")
4. Check "Also set up Firebase Hosting" if you plan to use it
5. Click "Register app"
6. Copy the Firebase configuration object for later use

## 3. Set Up Authentication

1. In the Firebase Console, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Enable the following sign-in methods:
   - Email/Password
   - Google
   - Facebook (requires additional setup with Facebook Developer account)
4. For each provider, follow the setup instructions

## 4. Create Firestore Database

1. In the Firebase Console, go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" for development (you'll update security rules later)
4. Select a location for your database (choose one close to your users)
5. Click "Enable"

## 5. Deploy Firestore Security Rules

1. In the Firebase Console, go to "Firestore Database"
2. Click on the "Rules" tab
3. Replace the default rules with the content from your `firestore.rules` file
4. Click "Publish"

## 6. Set Up Firebase Storage (Optional)

1. In the Firebase Console, go to "Storage" in the left sidebar
2. Click "Get started"
3. Choose "Start in test mode" for development
4. Select a location for your storage bucket
5. Click "Done"

## 7. Install Firebase CLI (For Deployment)

```bash
npm install -g firebase-tools
```

## 8. Initialize Firebase in Your Project

```bash
# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init
```

Select the following features:
- Firestore
- Hosting (if you plan to deploy your app)
- Storage (if you're using Firebase Storage)

## 9. Update Environment Variables

Create a `.env` file in your project root based on the `.env.example` template:

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

Replace the placeholder values with your actual Firebase configuration.

## 10. Deploy Your Application (Optional)

```bash
# Build your application
npm run build

# Deploy to Firebase Hosting
firebase deploy
```

## Troubleshooting

### 400 (Bad Request) Error When Accessing Firestore

If you encounter a 400 (Bad Request) error when trying to access Firestore, check the following:

1. **Firestore Database Not Created**: Make sure you've created a Firestore database in your Firebase project.

2. **Incorrect Firebase Configuration**: Verify that the Firebase configuration in your `src/lib/firebase.ts` file matches the configuration in your Firebase project settings.

3. **Firestore Rules Too Restrictive**: Temporarily set your Firestore rules to allow all access for testing:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

4. **CORS Issues**: If you're testing locally, make sure you're using `localhost` and not `127.0.0.1`.

5. **Firebase Project Region**: If your Firebase project is in a different region than your location, it might cause connectivity issues. Try creating a new project in a region closer to you.

### Authentication Issues

1. **Email/Password Provider Not Enabled**: Make sure you've enabled the Email/Password provider in the Firebase Authentication settings.

2. **Social Login Issues**: For Google and Facebook login, ensure you've completed all the setup steps, including configuring the OAuth redirect URI.

3. **Domain Verification**: For production, you may need to verify your domain in the Firebase Authentication settings.

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)
