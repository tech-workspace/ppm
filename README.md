<<<<<<< HEAD
# ppm
peekpark mobile app
=======
# PeekPark - React Native Mobile Application

A mockup/wireframe React Native mobile application for finding and navigating to parking lots. Built with Expo and TypeScript.

## Features

### 🔐 Authentication
- **Sign Up**: Create account with name and mobile number
- **Login**: OTP-based authentication with mobile number
- **Profile Management**: View user details and sign out

### 🚗 Parking Discovery
- **Find Parking**: Search for nearby parking lots with filtering by type
- **Parking Types**: 
  - P: Primary Parking (turquoise and white)
  - S: Standard Parking (turquoise and black)
  - SR: Standard Residential Parking (turquoise and black)
  - VG: Villa Guests Parking (gray)
- **Lot Details**: View comprehensive information including price, availability, location

### 🗺️ Interactive Map
- **Google Maps Integration**: Custom map with parking lot pins (mobile only)
- **Unique Markers**: Each parking type has distinct icons and colors
- **Navigation**: Navigate to selected parking lots
- **Real-time Location**: Get current user location
- **Web Fallback**: Parking lot list view for web browsers

### 🎨 Design
- **Color Scheme**: Turquoise, white, and black theme
- **Modern UI**: Clean, intuitive interface with proper safe area handling
- **Bottom Tabs**: Easy navigation between main features

## Tech Stack

- **React Native** with Expo
- **TypeScript** for type safety
- **React Navigation** for routing
- **Expo Location** for GPS functionality
- **React Native Maps** for map integration
- **AsyncStorage** for local data persistence
- **Expo Linear Gradient** for visual effects

## Project Structure

```
src/
├── components/          # Reusable UI components
├── constants/           # App constants and configurations
│   ├── colors.ts       # Color definitions
│   └── parkingTypes.ts # Parking type configurations
├── navigation/          # Navigation setup
│   └── AppNavigator.tsx
├── screens/            # App screens
│   ├── SignUpScreen.tsx
│   ├── LoginScreen.tsx
│   ├── ProfileScreen.tsx
│   ├── FindParkingScreen.tsx
│   └── InteractiveMapScreen.tsx
├── types/              # TypeScript type definitions
│   └── index.ts
└── utils/              # Utility functions and contexts
    ├── authContext.tsx # Authentication context
    └── mockData.ts     # Mock data for development
```

## Getting Started

### Prerequisites

- Node.js (v18.16.0 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development) or Android Emulator

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd PeekPark
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on device/simulator**
   ```bash
   # For iOS
   npm run ios
   
   # For Android
   npm run android
   
   # For web
   npm run web
   ```

## Configuration

### Google Maps API Key

For the Interactive Map functionality to work properly, you'll need to configure Google Maps API keys:

1. Get a Google Maps API key from the [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the following APIs in your Google Cloud project:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Places API
3. Replace `YOUR_GOOGLE_MAPS_API_KEY` in `app.json` with your actual API key:

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-maps",
        {
          "googleMapsApiKey": "YOUR_ACTUAL_API_KEY_HERE"
        }
      ]
    ]
  }
}
```

**Note**: The Interactive Map feature is only available on mobile devices (iOS/Android). Web browsers will show a parking lot list fallback view.

### Location Permissions

The app requires location permissions to function properly. These are handled automatically by Expo Location.

## Mock Data

The application uses mock data for development purposes:

- **User Data**: Sample user with mobile number `+971501234567`
- **Parking Lots**: 10 sample parking lots with various types and locations
- **OTP System**: Mock OTP generation (check console for OTP codes)

## Development Notes

### Authentication Flow
- OTP codes are logged to the console for testing
- User data is persisted using AsyncStorage
- Authentication state is managed through React Context

### Location Services
- Default location is set to Dubai (25.2048, 55.2708) for demo purposes
- Real location services require proper permissions
- Map functionality is available on mobile devices only (iOS/Android)
- Web browsers show a parking lot list fallback view

### Navigation
- Bottom tab navigation for main app features
- Stack navigation for authentication flow
- Proper safe area handling for different devices

## Testing

### Test Credentials
- **Mobile Number**: `+971501234567`
- **OTP**: Check console logs for generated OTP codes

### Features to Test
1. **Sign Up**: Create new account
2. **Login**: Use existing mobile number and OTP
3. **Find Parking**: Filter and search for parking lots
4. **Interactive Map**: View parking lots on map
5. **Navigation**: Test navigation between screens
6. **Profile**: View user details and sign out

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for demonstration purposes only.

## Support

For questions or issues, please create an issue in the repository. 
>>>>>>> af67968 (add ppm files v1)
