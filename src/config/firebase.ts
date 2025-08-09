// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
    apiKey: "AIzaSyBe3oA2jX4-zQvJupZNuuSjwRGiGYRanxY",
    authDomain: "peekpark-60611.firebaseapp.com",
    projectId: "peekpark-60611",
    storageBucket: "peekpark-60611.firebasestorage.app",
    messagingSenderId: "844638963740",
    appId: "1:844638963740:web:00eeb8541a61c99c2fb7d9",
    measurementId: "G-CCE2X3BPBM"
};

// Firestore collection names
export const COLLECTIONS = {
    USERS: 'users',
    PARKING_LOTS: 'parking_lots',
    BOOKINGS: 'bookings',
    DEVICES: 'devices',
    OTP_VERIFICATIONS: 'otp_verifications'
};

// Firebase Auth error messages
export const AUTH_ERRORS = {
    EMAIL_EXISTS: 'An account with this email already exists.',
    MOBILE_EXISTS: 'An account with this mobile number already exists.',
    INVALID_EMAIL: 'Please enter a valid email address.',
    INVALID_MOBILE: 'Please enter a valid mobile number.',
    WEAK_PASSWORD: 'Password should be at least 6 characters long.',
    USER_NOT_FOUND: 'No account found with this mobile number.',
    WRONG_PASSWORD: 'Incorrect password.',
    DEVICE_MISMATCH: 'This account is registered on another device. Please use the original device to login.',
    DEVICE_MISMATCH_DETAILED: 'This account is linked to another device. Device: {deviceName} ({manufacturer} {modelName})',
    INVALID_OTP: 'Invalid OTP. Please try again.',
    OTP_EXPIRED: 'OTP has expired. Please request a new one.',
    OTP_NOT_SENT: 'Failed to send OTP. Please try again.',
    NETWORK_ERROR: 'Network error. Please check your internet connection.',
    UNKNOWN_ERROR: 'An unknown error occurred. Please try again.',
    VERIFICATION_FAILED: 'Phone number verification failed. Please try again.',
    TOO_MANY_REQUESTS: 'Too many requests. Please try again later.',
    INVALID_PHONE_NUMBER: 'Please enter a valid UAE mobile number (9 digits starting with 50, 51, 52, 54, 55, 56, or 58).',
    PHONE_AUTH_DISABLED: 'Phone authentication is not enabled for this app.',
    RECAPTCHA_REQUIRED: 'reCAPTCHA verification failed. Please try again.',
    QUOTA_EXCEEDED: 'SMS quota exceeded. Please try again later.',
    // Production-specific error messages
    ACCESS_DENIED: 'Access denied. Please ensure you are properly authenticated.',
    SERVICE_UNAVAILABLE: 'Service temporarily unavailable. Please try again later.',
    ACCOUNT_CREATION_FAILED: 'Failed to create account. Please try again.',
    SESSION_EXPIRED: 'Your session has expired. Please log in again.',
    UNAUTHORIZED_ACCESS: 'Unauthorized access attempt detected.'
};

// Phone authentication settings for UAE
export const PHONE_AUTH_CONFIG = {
    // UAE country code (fixed)
    UAE_COUNTRY_CODE: '+971',
    // OTP timeout in seconds
    OTP_TIMEOUT: 60,
    // Maximum OTP attempts
    MAX_OTP_ATTEMPTS: 3,
    // Resend OTP cooldown in seconds
    RESEND_COOLDOWN: 30,
    // UAE phone number validation
    UAE_PHONE_LENGTH: 9, // 9 digits after country code
    UAE_VALID_PREFIXES: ['50', '51', '52', '54', '55', '56', '58'] // Valid UAE mobile prefixes
}; 