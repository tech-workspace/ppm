import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { mockUser } from './mockData';

interface AuthContextType {
    user: User | null;
    isLoggedIn: boolean;
    login: (mobileNumber: string) => Promise<boolean>;
    signup: (name: string, mobileNumber: string) => Promise<boolean>;
    logout: () => void;
    verifyOTP: (otp: string) => Promise<boolean>;
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

    useEffect(() => {
        loadUserFromStorage();
    }, []);

    const loadUserFromStorage = async () => {
        try {
            const storedUser = await AsyncStorage.getItem('user');

            if (storedUser) {
                const userData = JSON.parse(storedUser);
                setUser(userData);
            }
        } catch (error) {
            console.error('Error loading user from storage:', error);
        }
    };

    const generateOTP = (): string => {
        // For demo purposes, use a fixed OTP: 123456
        // In production, this would be a random 6-digit number
        const demoOTP = '123456';
        console.log('🔐 DEMO OTP GENERATED:', demoOTP);
        console.log('📱 Use this OTP to login:', demoOTP);
        return demoOTP;
    };

    const login = async (mobileNumber: string): Promise<boolean> => {
        try {
            // For demo purposes, accept any mobile number
            // In real app, this would validate against a database

            // Check if user exists in storage first
            const storedUser = await AsyncStorage.getItem('user');
            if (storedUser) {
                const userData = JSON.parse(storedUser);
                if (userData.mobileNumber === mobileNumber) {
                    // Existing user - generate OTP
                    const otp = generateOTP();
                    await AsyncStorage.setItem('userOTP', otp);

                    console.log('🎯 ==========================================');
                    console.log('📞 OTP SENT TO:', mobileNumber);
                    console.log('🔢 OTP CODE:', otp);
                    console.log('🎯 ==========================================');

                    return true;
                }
            }

            // If no existing user found, create a new one for demo
            const newUser: User = {
                id: Date.now().toString(),
                name: 'Demo User',
                mobileNumber: mobileNumber,
                isLoggedIn: false,
            };

            await AsyncStorage.setItem('user', JSON.stringify(newUser));
            // Don't set user state here - wait until OTP verification

            // Generate OTP for new user
            const otp = generateOTP();
            await AsyncStorage.setItem('userOTP', otp);

            console.log('🎯 ==========================================');
            console.log('📞 OTP SENT TO:', mobileNumber);
            console.log('🔢 OTP CODE:', otp);
            console.log('🎯 ==========================================');

            return true;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    };

    const signup = async (name: string, mobileNumber: string): Promise<boolean> => {
        try {
            // Mock signup - in real app, this would call an API
            const newUser: User = {
                id: Date.now().toString(),
                name,
                mobileNumber,
                isLoggedIn: false,
            };

            await AsyncStorage.setItem('user', JSON.stringify(newUser));
            // Don't set user state here - wait until OTP verification

            // Generate OTP for first login
            const otp = generateOTP();
            await AsyncStorage.setItem('userOTP', otp);

            console.log(`OTP sent to ${mobileNumber}: ${otp}`);
            return true;
        } catch (error) {
            console.error('Signup error:', error);
            return false;
        }
    };

    const verifyOTP = async (otp: string): Promise<boolean> => {
        try {
            // Read OTP from AsyncStorage
            const storedOTP = await AsyncStorage.getItem('userOTP');

            if (storedOTP && storedOTP === otp) {
                // OTP is correct, log user in
                const currentUser = user || mockUser;
                const loggedInUser = { ...currentUser, isLoggedIn: true };

                setUser(loggedInUser);
                await AsyncStorage.setItem('user', JSON.stringify(loggedInUser));
                await AsyncStorage.removeItem('userOTP');

                return true;
            }
            return false;
        } catch (error) {
            console.error('OTP verification error:', error);
            return false;
        }
    };

    const logout = async () => {
        try {
            if (user) {
                const loggedOutUser = { ...user, isLoggedIn: false };
                setUser(loggedOutUser);
                await AsyncStorage.setItem('user', JSON.stringify(loggedOutUser));
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const value: AuthContextType = {
        user,
        isLoggedIn: user?.isLoggedIn || false,
        login,
        signup,
        logout,
        verifyOTP,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 