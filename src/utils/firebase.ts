import { initializeApp } from 'firebase/app';
import {
    getAuth,
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
    ConfirmationResult
} from 'firebase/auth';
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
export const auth = getAuth(app);
export const db = getFirestore(app);

// Device-specific authentication
export class DeviceAuth {
    private static instance: DeviceAuth;
    private deviceId: string = '';
    private deviceInfo: DeviceInfo | null = null;
    private confirmationResult: ConfirmationResult | null = null;

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

    // Send OTP to mobile number using Firebase Phone Auth
    async sendOTP(mobileNumber: string): Promise<{ success: boolean; error?: string; verificationId?: string; deviceInfo?: DeviceInfo }> {
        try {
            // Validate phone number format
            if (!mobileNumber || mobileNumber.length < 10) {
                return {
                    success: false,
                    error: AUTH_ERRORS.INVALID_PHONE_NUMBER
                };
            }

            // Ensure phone number has country code
            let formattedNumber = mobileNumber;
            if (!mobileNumber.startsWith('+')) {
                formattedNumber = `${PHONE_AUTH_CONFIG.DEFAULT_COUNTRY_CODE}${mobileNumber}`;
            }

            // Check if user already exists
            const existingUser = await this.getUserByMobileNumber(mobileNumber);
            if (existingUser) {
                // Check if this is the registered device
                const deviceId = await this.getDeviceId();
                if (existingUser.deviceId !== deviceId) {
                    const deviceInfo = await this.getDeviceInfo();
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
            }

            // Send OTP using Firebase Phone Auth
            try {
                this.confirmationResult = await signInWithPhoneNumber(auth, formattedNumber, this.getRecaptchaVerifier());
                
                return { 
                    success: true, 
                    verificationId: this.confirmationResult.verificationId 
                };
            } catch (phoneAuthError: any) {
                console.error('Phone auth error:', phoneAuthError);
                
                // Handle specific Firebase phone auth errors
                switch (phoneAuthError.code) {
                    case 'auth/invalid-phone-number':
                        return { success: false, error: AUTH_ERRORS.INVALID_PHONE_NUMBER };
                    case 'auth/too-many-requests':
                        return { success: false, error: AUTH_ERRORS.TOO_MANY_REQUESTS };
                    case 'auth/quota-exceeded':
                        return { success: false, error: AUTH_ERRORS.QUOTA_EXCEEDED };
                    case 'auth/operation-not-allowed':
                        return { success: false, error: AUTH_ERRORS.PHONE_AUTH_DISABLED };
                    default:
                        return { success: false, error: AUTH_ERRORS.OTP_NOT_SENT };
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

    // Get reCAPTCHA verifier for phone authentication
    private getRecaptchaVerifier(): RecaptchaVerifier {
        // For web, you would create a reCAPTCHA verifier
        // For mobile apps, this is handled automatically by Firebase
        // This is a placeholder - in a real implementation, you might need to handle this differently
        return {} as RecaptchaVerifier;
    }

    // Verify OTP and login/register user
    async verifyOTP(mobileNumber: string, verificationId: string, otp: string, name?: string): Promise<{ success: boolean; error?: string; user?: any }> {
        try {
            if (!this.confirmationResult) {
                return { success: false, error: AUTH_ERRORS.INVALID_OTP };
            }

            // Verify OTP with Firebase
            try {
                const credential = PhoneAuthProvider.credential(this.confirmationResult.verificationId, otp);
                const userCredential = await signInWithCredential(auth, credential);
                const firebaseUser = userCredential.user;

                // Check if user exists in our database
                const existingUser = await this.getUserByMobileNumber(mobileNumber);

                if (existingUser) {
                    // User exists, update last login
                    try {
                        await updateDoc(doc(db, COLLECTIONS.USERS, existingUser.uid), {
                            lastLoginAt: new Date(),
                            isActive: true
                        });
                    } catch (error) {
                        console.warn('Could not update user login time in Firestore');
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

                    // Create user document
                    const userRef = doc(collection(db, COLLECTIONS.USERS));
                    const userData = {
                        uid: userRef.id,
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
                        console.error('Could not save user data to Firestore');
                        // Sign out the Firebase user since we couldn't save the data
                        await signOut(auth);
                        return { success: false, error: 'Failed to create user account' };
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
            const q = query(collection(db, COLLECTIONS.USERS), where('mobileNumber', '==', mobileNumber));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                return { uid: doc.id, ...doc.data() };
            }
            return null;
        } catch (error: any) {
            console.error('Get user by mobile number error:', error);
            if (error.code === 'permission-denied') {
                console.warn('Firestore permissions not configured. User lookup failed.');
                return null;
            }
            return null;
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
            await signOut(auth);
            this.confirmationResult = null;
        } catch (error) {
            console.error('Logout error:', error);
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