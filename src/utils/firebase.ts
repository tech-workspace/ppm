import { initializeApp } from 'firebase/app';
import {
    getAuth,
    initializeAuth,
    getReactNativePersistence,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User as FirebaseUser,
    sendPasswordResetEmail,
    PhoneAuthProvider,
    signInWithCredential,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    ConfirmationResult,
    ApplicationVerifier
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs,
    deleteDoc
} from 'firebase/firestore';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { firebaseConfig, COLLECTIONS, AUTH_ERRORS, PHONE_AUTH_CONFIG } from '../config/firebase';
import { DeviceInfo } from '../types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence for React Native
let auth: any;
try {
    // Try to initialize with React Native persistence
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
    });
} catch (error) {
    // Fallback to getAuth if already initialized or in web environment
    auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);

// Device-specific authentication
export class DeviceAuth {
    private static instance: DeviceAuth;
    private deviceId: string = '';
    private deviceInfo: DeviceInfo | null = null;
    private confirmationResult: ConfirmationResult | null = null;
    private recaptchaVerifier: RecaptchaVerifier | null = null;

    private constructor() { }

    static getInstance(): DeviceAuth {
        if (!DeviceAuth.instance) {
            DeviceAuth.instance = new DeviceAuth();
        }
        return DeviceAuth.instance;
    }

    async getDeviceId(): Promise<string> {
        if (!this.deviceId) {
            try {
                // Try to get device ID from expo-constants first
                if (Constants.deviceId && Constants.deviceId !== null) {
                    this.deviceId = Constants.deviceId;
                    return this.deviceId;
                }
            } catch (error) {
                console.log('Could not get device ID from constants');
            }

            // Fallback: Use a combination of device properties to create a unique identifier
            const deviceName = Device.deviceName || 'unknown';
            const deviceType = Device.deviceType || 'unknown';
            const osVersion = Device.osVersion || 'unknown';
            const modelName = Device.modelName || 'unknown';
            const appVersion = Constants.expoConfig?.version || '1.0.0';

            // Create a unique identifier based on device properties
            this.deviceId = `${deviceName}-${deviceType}-${osVersion}-${modelName}-${appVersion}`.replace(/\s+/g, '-').toLowerCase();

            // Ensure we always have a string value
            if (!this.deviceId) {
                this.deviceId = 'unknown-device';
            }
        }
        return this.deviceId;
    }

    async getDeviceInfo(): Promise<DeviceInfo> {
        if (!this.deviceInfo) {
            this.deviceInfo = {
                deviceName: Device.deviceName || 'Unknown Device',
                deviceType: Device.deviceType ? String(Device.deviceType) : 'unknown',
                osVersion: Device.osVersion || 'unknown',
                modelName: Device.modelName || 'unknown',
                manufacturer: Device.manufacturer || 'unknown',
                brand: Device.brand || 'unknown',
                appVersion: Constants.expoConfig?.version || '1.0.0'
            };
        }
        return this.deviceInfo!;
    }

    // Validate UAE phone number
    private isValidUAEPhoneNumber(phoneNumber: string): boolean {
        // Remove any spaces, dashes, or special characters
        const cleanNumber = phoneNumber.replace(/[\s-\(\)]/g, '');

        // Check if it starts with +971 or 971 or just the local number
        let localNumber = '';

        if (cleanNumber.startsWith('+971')) {
            localNumber = cleanNumber.substring(4);
        } else if (cleanNumber.startsWith('971')) {
            localNumber = cleanNumber.substring(3);
        } else if (cleanNumber.startsWith('0')) {
            // UAE numbers sometimes start with 0, remove it
            localNumber = cleanNumber.substring(1);
        } else {
            localNumber = cleanNumber;
        }

        // Check if the local number has exactly 9 digits
        if (localNumber.length !== PHONE_AUTH_CONFIG.UAE_PHONE_LENGTH) {
            return false;
        }

        // Check if it starts with a valid UAE mobile prefix
        const prefix = localNumber.substring(0, 2);
        return PHONE_AUTH_CONFIG.UAE_VALID_PREFIXES.includes(prefix);
    }

    // Format UAE phone number to international format
    private formatUAEPhoneNumber(phoneNumber: string): string {
        // Remove any spaces, dashes, or special characters
        const cleanNumber = phoneNumber.replace(/[\s-\(\)]/g, '');

        let localNumber = '';

        if (cleanNumber.startsWith('+971')) {
            return cleanNumber; // Already formatted
        } else if (cleanNumber.startsWith('971')) {
            return `+${cleanNumber}`;
        } else if (cleanNumber.startsWith('0')) {
            // UAE numbers sometimes start with 0, remove it and add country code
            localNumber = cleanNumber.substring(1);
        } else {
            localNumber = cleanNumber;
        }

        return `${PHONE_AUTH_CONFIG.UAE_COUNTRY_CODE}${localNumber}`;
    }

    // Send OTP to mobile number using Firebase Phone Auth
    async sendOTP(mobileNumber: string): Promise<{ success: boolean; error?: string; verificationId?: string; deviceInfo?: DeviceInfo }> {
        try {
            // Validate UAE phone number format
            if (!this.isValidUAEPhoneNumber(mobileNumber)) {
                return {
                    success: false,
                    error: AUTH_ERRORS.INVALID_PHONE_NUMBER
                };
            }

            // Format UAE phone number
            const formattedNumber = this.formatUAEPhoneNumber(mobileNumber);

            // DEVELOPMENT MODE: Static test login for mobile
            const isTestNumber = mobileNumber === '568863388' || formattedNumber === '+971568863388';
            const recaptchaVerifier = this.getRecaptchaVerifier();

            if (!recaptchaVerifier && isTestNumber) {
                // Mobile environment with test number - use static bypass
                console.log('Using static test login for mobile development');
                console.log('Test number detected:', formattedNumber);

                // Store test data for verification
                this.confirmationResult = {
                    verificationId: 'test-verification-id-' + Date.now(),
                    confirm: async (otp: string) => {
                        if (otp === '600660') {
                            // Return mock Firebase user for test
                            return {
                                user: {
                                    uid: 'test-user-uid-' + Date.now(),
                                    phoneNumber: formattedNumber
                                }
                            };
                        } else {
                            throw new Error('auth/invalid-verification-code');
                        }
                    }
                } as any;

                return {
                    success: true,
                    verificationId: this.confirmationResult.verificationId
                };
            }

            // Send OTP using Firebase Phone Auth
            try {
                if (!recaptchaVerifier) {
                    // Mobile environment - non-test number
                    console.log('Using mobile-friendly phone auth approach');
                    return {
                        success: false,
                        error: 'For mobile testing, use test number: 568863388 with OTP: 600660. For production, use web browser or Expo Development Build.'
                    };
                }

                this.confirmationResult = await signInWithPhoneNumber(auth, formattedNumber, recaptchaVerifier);

                return {
                    success: true,
                    verificationId: this.confirmationResult.verificationId
                };
            } catch (phoneAuthError: any) {
                console.error('Phone auth error:', phoneAuthError);
                console.log('Error details:', {
                    code: phoneAuthError.code,
                    message: phoneAuthError.message,
                    stack: phoneAuthError.stack
                });

                // Handle specific Firebase phone auth errors
                switch (phoneAuthError.code) {
                    case 'auth/billing-not-enabled':
                        return {
                            success: false,
                            error: 'SMS authentication requires Firebase Blaze plan. Please upgrade your Firebase project or use test phone numbers for development. See console for setup instructions.'
                        };
                    case 'auth/invalid-phone-number':
                        return { success: false, error: AUTH_ERRORS.INVALID_PHONE_NUMBER };
                    case 'auth/too-many-requests':
                        return { success: false, error: AUTH_ERRORS.TOO_MANY_REQUESTS };
                    case 'auth/quota-exceeded':
                        return { success: false, error: AUTH_ERRORS.QUOTA_EXCEEDED };
                    case 'auth/operation-not-allowed':
                        return { success: false, error: AUTH_ERRORS.PHONE_AUTH_DISABLED };
                    case 'auth/recaptcha-failed':
                    case 'auth/captcha-check-failed':
                        return { success: false, error: 'Verification failed. Please try again.' };
                    case 'auth/app-deleted':
                        return { success: false, error: 'Firebase app configuration error' };
                    case 'auth/app-not-authorized':
                        return { success: false, error: 'App not authorized for Firebase authentication' };
                    case 'auth/argument-error':
                        return { success: false, error: 'Invalid phone number format' };
                    case 'auth/code-expired':
                        return { success: false, error: AUTH_ERRORS.OTP_EXPIRED };
                    case 'auth/missing-verification-code':
                        return { success: false, error: 'Verification code is required' };
                    case 'auth/missing-verification-id':
                        return { success: false, error: 'Verification ID is missing' };
                    case 'auth/session-expired':
                        return { success: false, error: 'Session expired. Please try again.' };
                    default:
                        // For development, provide more specific error information
                        const errorMessage = phoneAuthError.message || AUTH_ERRORS.OTP_NOT_SENT;
                        console.warn('Unhandled phone auth error:', phoneAuthError.code, errorMessage);
                        return { success: false, error: `Phone authentication error: ${errorMessage}` };
                }
            }
        } catch (error: any) {
            console.error('Send OTP error:', error);
            return {
                success: false,
                error: error.message || AUTH_ERRORS.OTP_NOT_SENT
            };
        }
    }

    // Initialize reCAPTCHA verifier for phone authentication
    private initializeRecaptchaVerifier(): RecaptchaVerifier | null {
        if (this.recaptchaVerifier) {
            return this.recaptchaVerifier;
        }

        try {
            // Check if we're in a web environment
            if (typeof window !== 'undefined' && window.document && typeof document !== 'undefined') {
                // Web environment - create container if it doesn't exist
                let recaptchaContainer = window.document.getElementById('recaptcha-container');
                if (!recaptchaContainer) {
                    recaptchaContainer = window.document.createElement('div');
                    recaptchaContainer.id = 'recaptcha-container';
                    recaptchaContainer.style.position = 'fixed';
                    recaptchaContainer.style.top = '-1000px';
                    recaptchaContainer.style.left = '-1000px';
                    recaptchaContainer.style.width = '1px';
                    recaptchaContainer.style.height = '1px';
                    recaptchaContainer.style.visibility = 'hidden';
                    window.document.body.appendChild(recaptchaContainer);
                }

                // Create reCAPTCHA verifier for web
                this.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                    size: 'invisible',
                    callback: (response: string) => {
                        console.log('reCAPTCHA solved');
                    },
                    'expired-callback': () => {
                        console.log('reCAPTCHA expired');
                        this.recaptchaVerifier = null;
                    }
                });

                return this.recaptchaVerifier;
            } else {
                // React Native environment - reCAPTCHA not available
                console.log('Mobile environment detected - reCAPTCHA not available');
                return null;
            }
        } catch (error) {
            console.error('Failed to initialize reCAPTCHA:', error);
            // Don't throw error in mobile environment
            return null;
        }
    }

    // Get reCAPTCHA verifier for phone authentication
    private getRecaptchaVerifier(): RecaptchaVerifier | null {
        return this.initializeRecaptchaVerifier();
    }

    // Verify OTP and login/register user
    async verifyOTP(mobileNumber: string, verificationId: string, otp: string, name?: string): Promise<{ success: boolean; error?: string; user?: any }> {
        try {
            if (!this.confirmationResult) {
                return { success: false, error: AUTH_ERRORS.INVALID_OTP };
            }

            // Verify OTP with Firebase or test mode
            try {
                const result = await this.confirmationResult.confirm(otp);
                const firebaseUser = result.user;

                // Check if this is a test user (mobile development mode)
                const isTestUser = firebaseUser.uid.startsWith('test-user-uid-');

                if (isTestUser) {
                    // Handle test user for mobile development
                    console.log('Processing test user for mobile development');

                    const deviceId = await this.getDeviceId();
                    const deviceInfo = await this.getDeviceInfo();

                    // Create or return test user data
                    const testUserData = {
                        uid: firebaseUser.uid,
                        firebaseUid: firebaseUser.uid,
                        mobileNumber,
                        name: name || 'Test User',
                        deviceId,
                        deviceInfo,
                        createdAt: new Date(),
                        lastLoginAt: new Date(),
                        isActive: true,
                        isVerified: true,
                        isTestUser: true // Flag to identify test users
                    };

                    console.log('Test user login successful');
                    return { success: true, user: testUserData };
                }

                // Now that user is authenticated, check if user exists in our database
                const existingUser = await this.getUserByMobileNumber(mobileNumber);

                if (existingUser) {
                    // Check device restriction for existing users
                    const currentDeviceId = await this.getDeviceId();
                    if (existingUser.deviceId && existingUser.deviceId !== currentDeviceId) {
                        // Sign out the Firebase user since device doesn't match
                        await signOut(auth);

                        const errorMessage = AUTH_ERRORS.DEVICE_MISMATCH_DETAILED
                            .replace('{deviceName}', existingUser.deviceInfo?.deviceName || 'Unknown')
                            .replace('{manufacturer}', existingUser.deviceInfo?.manufacturer || 'Unknown')
                            .replace('{modelName}', existingUser.deviceInfo?.modelName || 'Unknown');

                        return {
                            success: false,
                            error: errorMessage,
                            deviceInfo: existingUser.deviceInfo
                        };
                    }

                    // User exists and device matches, update last login
                    try {
                        await updateDoc(doc(db, COLLECTIONS.USERS, existingUser.uid), {
                            lastLoginAt: new Date(),
                            isActive: true
                        });
                    } catch (error) {
                        console.error('Could not update user login time in Firestore:', error);
                        // Don't fail login if we can't update login time
                    }

                    return { success: true, user: existingUser };
                } else {
                    // New user, create account
                    if (!name) {
                        // Sign out the Firebase user since we can't create the account
                        await signOut(auth);
                        return { success: false, error: 'Name is required for new users' };
                    }

                    const deviceId = await this.getDeviceId();
                    const deviceInfo = await this.getDeviceInfo();

                    // Create user document using Firebase user ID as document ID
                    const userRef = doc(db, COLLECTIONS.USERS, firebaseUser.uid);
                    const userData = {
                        uid: firebaseUser.uid,
                        firebaseUid: firebaseUser.uid,
                        mobileNumber,
                        name,
                        deviceId,
                        deviceInfo,
                        createdAt: new Date(),
                        lastLoginAt: new Date(),
                        isActive: true,
                        isVerified: true
                    };

                    try {
                        await setDoc(userRef, userData);
                    } catch (error) {
                        console.error('Could not save user data to Firestore:', error);
                        // Sign out the Firebase user since we couldn't save the data
                        await signOut(auth);
                        return { success: false, error: 'Failed to create user account. Please try again.' };
                    }

                    return { success: true, user: userData };
                }
            } catch (credentialError: any) {
                console.error('Credential error:', credentialError);

                // Handle specific Firebase credential errors
                switch (credentialError.code) {
                    case 'auth/invalid-verification-code':
                        return { success: false, error: AUTH_ERRORS.INVALID_OTP };
                    case 'auth/invalid-verification-id':
                        return { success: false, error: AUTH_ERRORS.INVALID_OTP };
                    case 'auth/code-expired':
                        return { success: false, error: AUTH_ERRORS.OTP_EXPIRED };
                    default:
                        return { success: false, error: AUTH_ERRORS.VERIFICATION_FAILED };
                }
            }
        } catch (error: any) {
            console.error('Verify OTP error:', error);
            return {
                success: false,
                error: error.message || AUTH_ERRORS.VERIFICATION_FAILED
            };
        }
    }

    // Get user by mobile number
    async getUserByMobileNumber(mobileNumber: string): Promise<any> {
        try {
            // Ensure user is authenticated before querying
            const currentUser = auth.currentUser;
            if (!currentUser) {
                console.warn('User not authenticated for mobile number lookup');
                return null;
            }

            const q = query(collection(db, COLLECTIONS.USERS), where('mobileNumber', '==', mobileNumber));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                return { uid: doc.id, ...doc.data() };
            }
            return null;
        } catch (error: any) {
            console.error('Get user by mobile number error:', error);

            // Handle specific Firestore errors in production
            switch (error.code) {
                case 'permission-denied':
                    throw new Error('Access denied. Please ensure you are properly authenticated.');
                case 'unavailable':
                    throw new Error('Service temporarily unavailable. Please try again later.');
                case 'deadline-exceeded':
                    throw new Error('Request timeout. Please check your connection and try again.');
                case 'unauthenticated':
                    throw new Error('Authentication required. Please log in again.');
                default:
                    throw new Error('Failed to lookup user. Please try again.');
            }
        }
    }

    // Legacy methods for email/password auth (keeping for backward compatibility)
    async registerUser(email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> {
        try {
            const deviceId = await this.getDeviceId();

            // Create user with Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Store user data in Firestore with device ID
            await setDoc(doc(db, COLLECTIONS.USERS, user.uid), {
                uid: user.uid,
                email: user.email,
                name: name,
                deviceId: deviceId,
                createdAt: new Date(),
                isActive: true
            });

            return { success: true };
        } catch (error: any) {
            console.error('Registration error:', error);
            return {
                success: false,
                error: error.message || AUTH_ERRORS.UNKNOWN_ERROR
            };
        }
    }

    async loginUser(email: string, password: string): Promise<{ success: boolean; error?: string }> {
        try {
            const deviceId = await this.getDeviceId();

            // Sign in with Firebase Auth
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Check if user exists in Firestore
            const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));

            if (!userDoc.exists()) {
                await signOut(auth);
                return {
                    success: false,
                    error: AUTH_ERRORS.USER_NOT_FOUND
                };
            }

            const userData = userDoc.data();

            // Check if this is the registered device
            if (userData.deviceId !== deviceId) {
                await signOut(auth);
                return {
                    success: false,
                    error: AUTH_ERRORS.DEVICE_MISMATCH
                };
            }

            // Update last login time
            await updateDoc(doc(db, COLLECTIONS.USERS, user.uid), {
                lastLoginAt: new Date(),
                isActive: true
            });

            return { success: true };
        } catch (error: any) {
            console.error('Login error:', error);
            return {
                success: false,
                error: error.message || AUTH_ERRORS.UNKNOWN_ERROR
            };
        }
    }

    async logoutUser(): Promise<void> {
        try {
            console.log('Signing out from Firebase...');
            await signOut(auth);

            // Clear all local state
            this.confirmationResult = null;
            this.recaptchaVerifier = null;

            console.log('Firebase logout completed');
        } catch (error) {
            console.error('Firebase logout error:', error);
            // Force clear local state even if signOut fails
            this.confirmationResult = null;
            this.recaptchaVerifier = null;
            throw error; // Re-throw to let the auth context handle it
        }
    }

    async getCurrentUser(): Promise<FirebaseUser | null> {
        return auth.currentUser;
    }

    async getUserData(uid: string): Promise<any> {
        try {
            const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, uid));
            if (userDoc.exists()) {
                return userDoc.data();
            }
            return null;
        } catch (error) {
            console.error('Get user data error:', error);
            return null;
        }
    }

    async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
        try {
            await sendPasswordResetEmail(auth, email);
            return { success: true };
        } catch (error: any) {
            console.error('Password reset error:', error);
            return {
                success: false,
                error: error.message || AUTH_ERRORS.UNKNOWN_ERROR
            };
        }
    }

    // Listen to auth state changes
    onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
        return onAuthStateChanged(auth, callback);
    }
}

export const deviceAuth = DeviceAuth.getInstance(); 