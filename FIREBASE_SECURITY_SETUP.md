# Firebase Security Rules Setup

## Current Issue
The app is getting "Missing or insufficient permissions" errors when trying to access Firestore. This is because the default Firebase security rules are too restrictive.

## Quick Fix (Development)

### Option 1: Firebase Console (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `peekpark-60611`
3. Navigate to **Firestore Database** in the left sidebar
4. Click on the **Rules** tab
5. Replace the existing rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all users under any document
    // WARNING: This is for development only. Do not use in production!
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

6. Click **Publish** to save the rules

### Option 2: Firebase CLI (If you have it installed)
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init firestore`
4. Deploy rules: `firebase deploy --only firestore:rules`

## Production Security Rules

For production, use these more secure rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // OTP verifications - allow authenticated users to create/read
    match /otp_verifications/{verificationId} {
      allow read, write: if request.auth != null;
    }
    
    // Parking lots - public read, authenticated write
    match /parking_lots/{lotId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Bookings - users can only access their own bookings
    match /bookings/{bookingId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.userId || request.auth.uid == request.resource.data.userId);
    }
    
    // Devices collection - users can only access their own device data
    match /devices/{deviceId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

## Testing the Fix

After updating the rules:
1. Restart your Expo development server
2. Try the mobile authentication flow again
3. The "Missing or insufficient permissions" errors should be resolved

## Important Notes

- **Development Rules**: The current rules allow full access for development
- **Production Rules**: Use the secure rules above for production deployment
- **Authentication**: Make sure Firebase Authentication is properly configured
- **Collections**: The app uses these collections:
  - `users` - User account data
  - `otp_verifications` - OTP verification data
  - `parking_lots` - Parking lot information
  - `bookings` - User bookings
  - `devices` - Device information

## Troubleshooting

If you still get permission errors:
1. Check that your Firebase project ID matches in the config
2. Verify that Firestore Database is enabled in your project
3. Ensure you're using the correct Firebase configuration
4. Check the Firebase Console logs for more detailed error information
