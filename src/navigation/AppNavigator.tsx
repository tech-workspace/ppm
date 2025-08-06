import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useAuth } from '../utils/authContext';

// Import screens
import SignUpScreen from '../screens/SignUpScreen';
import LoginScreen from '../screens/LoginScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FindParkingScreen from '../screens/FindParkingScreen';
import InteractiveMapScreen from '../screens/InteractiveMapScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator for authenticated users
const MainTabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap;

                    if (route.name === 'FindParking') {
                        iconName = focused ? 'search' : 'search-outline';
                    } else if (route.name === 'InteractiveMap') {
                        iconName = focused ? 'map' : 'map-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person' : 'person-outline';
                    } else {
                        iconName = 'help-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: COLORS.turquoise,
                tabBarInactiveTintColor: COLORS.secondaryText,
                tabBarStyle: {
                    backgroundColor: COLORS.white,
                    borderTopWidth: 1,
                    borderTopColor: COLORS.border,
                    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
                    paddingTop: 8,
                    height: Platform.OS === 'ios' ? 88 : 70,
                    shadowColor: COLORS.black,
                    shadowOffset: {
                        width: 0,
                        height: -2,
                    },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    marginTop: 2,
                },
                headerShown: false,
            })}
        >
            <Tab.Screen
                name="FindParking"
                component={FindParkingScreen}
                options={{ tabBarLabel: 'Find Parking' }}
            />
            <Tab.Screen
                name="InteractiveMap"
                component={InteractiveMapScreen}
                options={{ tabBarLabel: 'Map' }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ tabBarLabel: 'Profile' }}
            />
        </Tab.Navigator>
    );
};

// Main App Navigator with authentication flow
const AppNavigator = () => {
    const { isLoggedIn, isLoading } = useAuth();

    if (isLoading) {
        // You can add a loading screen here
        return null;
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                }}
            >
                {!isLoggedIn ? (
                    // Authentication screens
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="SignUp" component={SignUpScreen} />
                    </>
                ) : (
                    // Main app screens
                    <Stack.Screen name="MainApp" component={MainTabNavigator} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator; 