# Firebase Authentication Setup Guide

This guide will help you set up Firebase Authentication with device-specific login for the PeekPark app.

## Prerequisites

1. A Firebase project
2. Node.js and npm installed
3. React Native development environment set up

## Step 1: Install Dependencies

First, install the required dependencies when you have sufficient disk space:

```bash
npm install firebase react-native-device-info
```

## Step 2: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select an existing project
3. Follow the setup wizard
4. Enable Authentication and Firestore Database

## Step 3: Configure Firebase Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable **Email/Password** authentication
3. Configure any additional sign-in methods if needed

## Step 4: Configure Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Create a database in **production mode** or **test mode**
3. Set up security rules for the `users` collection:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow read access to parking lots for all authenticated users
    match /parking_lots/{document=**} {
      allow read: if request.auth != null;
    }
    
    // Allow read/write access to bookings for authenticated users
    match /bookings/{bookingId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Step 5: Update Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. Click **Add app** and select **Web**
4. Register your app and copy the configuration
5. Update `src/config/firebase.ts` with your actual configuration:

```typescript
export const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-actual-sender-id",
  appId: "your-actual-app-id"
};
```

## Step 6: Test the Setup

1. Run your app: `npm start`
2. Try creating a new account
3. Try logging in with the created account
4. Test device-specific login by trying to login from a different device

## Features Implemented

### 🔐 Firebase Authentication
- Email/password authentication
- User registration and login
- Password reset functionality
- Secure user data storage

### 📱 Device-Specific Login
- Each account is tied to a specific device
- Users can only login from the device they registered on
- Prevents unauthorized access from other devices
- Uses `react-native-device-info` for unique device identification

### 🛡️ Security Features
- Password strength validation
- Email format validation
- Device ID verification
- Secure Firestore rules
- Error handling and user feedback

### 📊 User Data Management
- User profiles stored in Firestore
- Device ID tracking
- Login history
- Account status management

## File Structure

```
src/
├── config/
│   └── firebase.ts          # Firebase configuration
├── utils/
│   ├── authContext.tsx      # Authentication context
│   └── firebase.ts          # Firebase utilities
├── screens/
│   ├── LoginScreen.tsx      # Login screen
│   └── SignUpScreen.tsx     # Signup screen
└── types/
    └── index.ts             # TypeScript types
```

## Troubleshooting

### Common Issues

1. **"Firebase not initialized" error**
   - Make sure you've updated the Firebase configuration in `src/config/firebase.ts`
   - Check that all Firebase services are enabled in your Firebase project

2. **"Device ID not found" error**
   - Ensure `react-native-device-info` is properly installed
   - Check device permissions

3. **"Permission denied" error**
   - Verify Firestore security rules
   - Check that the user is properly authenticated

4. **"Network error"**
   - Check internet connection
   - Verify Firebase project is active
   - Check if Firebase services are available in your region

### Debug Mode

To enable debug logging, add this to your app initialization:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Connect to emulators (for development)
if (__DEV__) {
  connectAuthEmulator(getAuth(app), 'http://localhost:9099');
  connectFirestoreEmulator(getFirestore(app), 'localhost', 8080);
}
```

## Security Considerations

1. **Never commit Firebase config with real credentials to version control**
2. **Use environment variables for sensitive data**
3. **Implement proper error handling**
4. **Regularly update Firebase SDK versions**
5. **Monitor Firebase usage and costs**

## Next Steps

1. Implement password reset functionality
2. Add email verification
3. Implement user profile management
4. Add social authentication (Google, Facebook, etc.)
5. Implement push notifications
6. Add analytics and crash reporting

## Support

For Firebase-specific issues, refer to:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Support](https://firebase.google.com/support) 