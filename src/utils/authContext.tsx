import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthResponse, LoginFormData, SignupFormData, OTPVerificationData, MobileLoginData, DeviceInfo } from '../types';
import { deviceAuth } from './firebase';

interface AuthContextType {
    user: User | null;
    isLoggedIn: boolean;
    isLoading: boolean;
    login: (data: LoginFormData) => Promise<AuthResponse>;
    signup: (data: SignupFormData) => Promise<AuthResponse>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<AuthResponse>;
    // New mobile authentication methods
    sendOTP: (data: MobileLoginData) => Promise<AuthResponse>;
    verifyOTP: (data: OTPVerificationData, name?: string) => Promise<AuthResponse>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Load user from AsyncStorage on app start
        const loadUserFromStorage = async () => {
            try {
                const storedUser = await AsyncStorage.getItem('user');
                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser);
                }
            } catch (error) {
                console.error('Error loading user from storage:', error);
            } finally {
                setIsLoading(false);
            }
        };

        // Listen to Firebase auth state changes
        const unsubscribe = deviceAuth.onAuthStateChanged(async (firebaseUser) => {
            console.log('Firebase auth state changed:', firebaseUser ? 'logged in' : 'logged out');

            if (!firebaseUser) {
                // User is signed out, clear all state
                console.log('Firebase user signed out, clearing app state');
                setUser(null);
                try {
                    await AsyncStorage.removeItem('user');
                } catch (error) {
                    console.error('Error clearing AsyncStorage:', error);
                }
            }
        });

        loadUserFromStorage();

        // Cleanup subscription on unmount
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);

    const createAppUser = (userData: any): User => {
        return {
            id: userData.uid,
            uid: userData.uid,
            name: userData.name,
            email: userData.email,
            mobileNumber: userData.mobileNumber,
            photo: userData.photo,
            isLoggedIn: true,
            deviceId: userData.deviceId,
            deviceInfo: userData.deviceInfo,
            createdAt: userData.createdAt?.toDate ? userData.createdAt.toDate() : userData.createdAt,
            lastLoginAt: userData.lastLoginAt?.toDate ? userData.lastLoginAt.toDate() : userData.lastLoginAt,
            isActive: userData.isActive,
            isVerified: userData.isVerified
        };
    };

    const login = async (data: LoginFormData): Promise<AuthResponse> => {
        try {
            setIsLoading(true);
            // For mobile-only auth, we'll use a different approach
            if (data.mobileNumber) {
                return { success: false, error: 'Please use sendOTP for mobile authentication' };
            }
            const result = await deviceAuth.loginUser(data.email || '', data.password || '');

            if (result.success) {
                const firebaseUser = await deviceAuth.getCurrentUser();
                if (firebaseUser) {
                    const userData = await deviceAuth.getUserData(firebaseUser.uid);
                    if (userData) {
                        const appUser = createAppUser(userData);
                        setUser(appUser);
                        await AsyncStorage.setItem('user', JSON.stringify(appUser));
                        return { success: true, user: appUser };
                    }
                }
            }

            return { success: false, error: result.error };
        } catch (error: any) {
            console.error('Login error:', error);
            return { success: false, error: error.message || 'Login failed' };
        } finally {
            setIsLoading(false);
        }
    };

    const signup = async (data: SignupFormData): Promise<AuthResponse> => {
        try {
            setIsLoading(true);

            // Validate password confirmation if password is provided
            if (data.password && data.confirmPassword && data.password !== data.confirmPassword) {
                return { success: false, error: 'Passwords do not match' };
            }

            // Validate password strength if password is provided
            if (data.password && data.password.length < 6) {
                return { success: false, error: 'Password must be at least 6 characters long' };
            }

            if (data.password) {
                // Email/password signup
                const result = await deviceAuth.registerUser(data.email || '', data.password, data.name);

                if (result.success) {
                    const firebaseUser = await deviceAuth.getCurrentUser();
                    if (firebaseUser) {
                        const userData = await deviceAuth.getUserData(firebaseUser.uid);
                        if (userData) {
                            const appUser = createAppUser({ ...userData, mobileNumber: data.mobileNumber });
                            setUser(appUser);
                            await AsyncStorage.setItem('user', JSON.stringify(appUser));
                            return { success: true, user: appUser };
                        }
                    }
                }

                return { success: false, error: result.error };
            } else {
                // Mobile-only signup (requires OTP verification)
                return { success: false, error: 'Please use sendOTP and verifyOTP for mobile authentication' };
            }
        } catch (error: any) {
            console.error('Signup error:', error);
            return { success: false, error: error.message || 'Signup failed' };
        } finally {
            setIsLoading(false);
        }
    };

    const sendOTP = async (data: MobileLoginData): Promise<AuthResponse> => {
        try {
            const result = await deviceAuth.sendOTP(data.mobileNumber);

            if (result.success) {
                return {
                    success: true,
                    verificationId: result.verificationId
                };
            } else {
                return {
                    success: false,
                    error: result.error,
                    deviceInfo: result.deviceInfo
                };
            }
        } catch (error: any) {
            console.error('Send OTP error:', error);
            return { success: false, error: error.message || 'Failed to send OTP' };
        }
    };

    const verifyOTP = async (data: OTPVerificationData, name?: string): Promise<AuthResponse> => {
        try {
            setIsLoading(true);
            const result = await deviceAuth.verifyOTP(data.mobileNumber, data.verificationId, data.otp, name);

            if (result.success && result.user) {
                const appUser = createAppUser(result.user);
                setUser(appUser);
                await AsyncStorage.setItem('user', JSON.stringify(appUser));
                return { success: true, user: appUser };
            }

            return { success: false, error: result.error };
        } catch (error: any) {
            console.error('Verify OTP error:', error);
            return { success: false, error: error.message || 'OTP verification failed' };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async (): Promise<void> => {
        try {
            console.log('Starting logout process...');
            setIsLoading(true);

            // Sign out from Firebase
            await deviceAuth.logoutUser();
            console.log('Firebase signout completed');

            // Clear user state
            setUser(null);
            console.log('User state cleared');

            // Clear AsyncStorage
            await AsyncStorage.removeItem('user');
            console.log('AsyncStorage cleared');

            console.log('Logout completed successfully');
        } catch (error) {
            console.error('Logout error:', error);
            // Force clear state even if there's an error
            setUser(null);
            try {
                await AsyncStorage.removeItem('user');
            } catch (storageError) {
                console.error('AsyncStorage clear error:', storageError);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const resetPassword = async (email: string): Promise<AuthResponse> => {
        try {
            const result = await deviceAuth.resetPassword(email);
            return result;
        } catch (error: any) {
            console.error('Password reset error:', error);
            return { success: false, error: error.message || 'Password reset failed' };
        }
    };

    const value: AuthContextType = {
        user,
        isLoggedIn: user?.isLoggedIn || false,
        isLoading,
        login,
        signup,
        logout,
        resetPassword,
        sendOTP,
        verifyOTP,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 