# Firebase Phone Authentication Setup Guide

## Overview
This guide will help you set up Firebase Phone Authentication for your PeekPark app. Phone authentication allows users to sign in using their phone number and a one-time password (OTP).

## Prerequisites
- Firebase project created
- Firestore Database enabled
- Firebase Authentication enabled

## Step 1: Enable Phone Authentication in Firebase Console

### 1.1 Navigate to Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `peekpark-60611`

### 1.2 Enable Phone Authentication
1. In the left sidebar, click **Authentication**
2. Click on the **Sign-in method** tab
3. Find **Phone** in the list of providers
4. Click on **Phone** to open the configuration
5. Click the **Enable** toggle to turn on Phone Authentication
6. Click **Save**

### 1.3 Configure Phone Authentication Settings
1. **Test phone numbers** (Optional): Add test phone numbers for development
   - Click **Add phone number**
   - Enter a test phone number (e.g., +1234567890)
   - This allows you to test without sending real SMS

2. **SMS settings** (Optional): Configure SMS templates
   - You can customize the SMS message template
   - Default template: "Your verification code is: {code}"

## Step 2: Update Firestore Security Rules

### 2.1 Navigate to Firestore Rules
1. In Firebase Console, go to **Firestore Database**
2. Click on the **Rules** tab

### 2.2 Update Rules
Replace the existing rules with the secure rules from `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      // Allow creation during signup
      allow create: if request.auth != null;
    }
    
    // OTP verifications - allow authenticated users to create/read
    match /otp_verifications/{verificationId} {
      allow read, write: if request.auth != null;
      // Allow creation during OTP verification process
      allow create: if true;
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

3. Click **Publish** to save the rules

## Step 3: Configure App for Phone Authentication

### 3.1 For Web Apps (if applicable)
If you're also targeting web, you'll need to configure reCAPTCHA:

1. In Firebase Console, go to **Authentication** → **Settings**
2. Scroll down to **Authorized domains**
3. Add your domain (e.g., `localhost` for development)

### 3.2 For Mobile Apps
The current implementation is optimized for mobile apps using Expo. No additional configuration is needed for the mobile app.

## Step 4: Test Phone Authentication

### 4.1 Development Testing
1. Use test phone numbers (if configured)
2. The app will send real SMS to these numbers
3. Check the Firebase Console logs for any errors

### 4.2 Production Testing
1. Use real phone numbers
2. Ensure you have sufficient SMS quota
3. Monitor Firebase Console for usage and errors

## Step 5: Monitor and Maintain

### 5.1 Monitor Usage
1. **Authentication**: Check sign-in attempts and success rates
2. **Firestore**: Monitor database usage and costs
3. **SMS**: Track SMS usage and costs

### 5.2 Security Best Practices
1. **Rate Limiting**: Firebase automatically handles rate limiting
2. **Device Verification**: The app implements device restriction
3. **Error Handling**: Proper error messages for users

## Troubleshooting

### Common Issues

#### 1. "Phone authentication is not enabled"
- **Solution**: Enable Phone Authentication in Firebase Console
- **Location**: Authentication → Sign-in method → Phone

#### 2. "Invalid phone number"
- **Solution**: Ensure phone numbers include country code
- **Format**: +1234567890 (with + and country code)

#### 3. "SMS quota exceeded"
- **Solution**: 
  - Check Firebase Console for SMS usage
  - Upgrade Firebase plan if needed
  - Use test phone numbers for development

#### 4. "reCAPTCHA verification failed" (Web only)
- **Solution**: 
  - Configure reCAPTCHA for web apps
  - Add domain to authorized domains

#### 5. "Permission denied" errors
- **Solution**: 
  - Update Firestore security rules
  - Ensure rules are published
  - Check user authentication status

### Debug Steps
1. Check Firebase Console logs
2. Verify phone number format
3. Test with known working phone numbers
4. Check network connectivity
5. Verify Firebase configuration in app

## Production Considerations

### 1. SMS Costs
- Firebase charges for SMS sent
- Monitor usage in Firebase Console
- Consider implementing rate limiting

### 2. Security
- Device restriction prevents account sharing
- Secure Firestore rules protect user data
- Regular security audits recommended

### 3. User Experience
- Clear error messages
- Resend OTP functionality
- Proper loading states
- Device mismatch information

### 4. Compliance
- Ensure compliance with local SMS regulations
- Privacy policy for phone number collection
- GDPR compliance if applicable

## Support

If you encounter issues:
1. Check Firebase Console logs
2. Review Firebase documentation
3. Check Firebase status page
4. Contact Firebase support if needed

## Next Steps

After setup:
1. Test the complete authentication flow
2. Monitor for any errors or issues
3. Implement additional security measures if needed
4. Consider adding analytics for user behavior
5. Plan for production deployment
