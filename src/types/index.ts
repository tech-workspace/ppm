export interface User {
    id: string;
    uid?: string; // Firebase UID
    name: string;
    email?: string; // Optional for mobile-only auth
    mobileNumber: string; // Primary authentication method
    photo?: string;
    isLoggedIn: boolean;
    deviceId?: string; // Device unique identifier
    deviceInfo?: DeviceInfo; // Detailed device information
    createdAt?: Date;
    lastLoginAt?: Date;
    isActive?: boolean;
    isVerified?: boolean; // OTP verification status
}

// Device information for device restriction
export interface DeviceInfo {
    deviceName: string;
    deviceType: string;
    osVersion: string;
    modelName: string;
    manufacturer: string;
    brand: string;
    appVersion: string;
}

// Firebase User type for authentication
export interface FirebaseUserData {
    uid: string;
    email?: string;
    mobileNumber: string;
    name: string;
    deviceId: string;
    deviceInfo: DeviceInfo;
    createdAt: Date;
    lastLoginAt?: Date;
    isActive: boolean;
    photo?: string;
    isVerified: boolean;
}

// Authentication response types
export interface AuthResponse {
    success: boolean;
    error?: string;
    user?: User;
    verificationId?: string; // For OTP verification
    deviceInfo?: DeviceInfo; // For device mismatch errors
}

// Login/Signup form data
export interface LoginFormData {
    mobileNumber?: string;
    email?: string;
    password?: string; // Optional for OTP-only auth
}

export interface SignupFormData {
    name: string;
    mobileNumber: string;
    email?: string; // Optional
    password?: string; // Optional for OTP-only auth
    confirmPassword?: string;
}

// OTP verification data
export interface OTPVerificationData {
    mobileNumber: string;
    verificationId: string;
    otp: string;
}

// Mobile login data
export interface MobileLoginData {
    mobileNumber: string;
}

export interface ParkingLot {
    id: string;
    name: string;
    type: ParkingType;
    color: string;
    price: number;
    zoneName: string;
    sectorName: string;
    streetName: string;
    totalSpots: number;
    availableSpots: number;
    latitude: number;
    longitude: number;
    distance?: number;
}

export type ParkingType = 'P' | 'S' | 'SR' | 'VG';

export interface ParkingTypeConfig {
    type: ParkingType;
    label: string;
    color: string;
    backgroundColor: string;
    icon: string;
    iconColor: string;
}

export interface Location {
    latitude: number;
    longitude: number;
}

export interface NavigationProps {
    navigation: any;
    route: any;
}

export interface TabNavigationProps {
    navigation: any;
} 