import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Image,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/colors';
import { useAuth } from '../utils/authContext';
import { LoginFormData, DeviceInfo } from '../types';
import UAEFlagIcon from '../components/UAEFlagIcon';

interface LoginScreenProps {
    navigation: any;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
    const [mobileNumber, setMobileNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [verificationId, setVerificationId] = useState('');
    const [showOTPInput, setShowOTPInput] = useState(false);
    const [isNewUser, setIsNewUser] = useState(false);
    const [userName, setUserName] = useState('');
    const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
    const [isResendDisabled, setIsResendDisabled] = useState(false);
    const [resendCountdown, setResendCountdown] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const { sendOTP, verifyOTP } = useAuth();

    // Countdown timer for resend button
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (resendCountdown > 0) {
            interval = setInterval(() => {
                setResendCountdown((countdown) => countdown - 1);
            }, 1000);
        } else if (resendCountdown === 0 && isResendDisabled) {
            setIsResendDisabled(false);
        }
        if (interval && resendCountdown === 0) {
            clearInterval(interval);
        }
        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [resendCountdown, isResendDisabled]);

    const handleSendOTP = async () => {
        if (!mobileNumber.trim()) {
            Alert.alert('Error', 'Please enter your UAE mobile number');
            return;
        }

        if (mobileNumber.length !== 9) {
            Alert.alert('Error', 'UAE mobile number must be exactly 9 digits');
            return;
        }

        // Check if it starts with valid UAE prefix
        const validPrefixes = ['50', '51', '52', '54', '55', '56', '58'];
        const prefix = mobileNumber.substring(0, 2);
        if (!validPrefixes.includes(prefix)) {
            Alert.alert('Error', 'UAE mobile number must start with 50, 51, 52, 54, 55, 56, or 58');
            return;
        }

        setIsLoading(true);

        try {
            const result = await sendOTP({ mobileNumber: mobileNumber.trim() });

            if (result.success && result.verificationId) {
                setVerificationId(result.verificationId);
                setShowOTPInput(true);
                setIsResendDisabled(true);
                setResendCountdown(30);
            } else {
                // Check for device restriction
                if (result.deviceInfo) {
                    setDeviceInfo(result.deviceInfo);
                    Alert.alert(
                        'Device Restriction',
                        result.error || 'This account is linked to another device.',
                        [{ text: 'OK' }]
                    );
                    return;
                }

                // FALLBACK: For test number, force show OTP input
                if (mobileNumber.trim() === '568863388') {
                    setVerificationId('fallback-verification-id');
                    setShowOTPInput(true);
                    setIsResendDisabled(true);
                    setResendCountdown(30);
                } else {
                    Alert.alert('Error', result.error || 'Failed to send OTP');
                }
            }
        } catch (error) {
            console.error('Send OTP error:', error);
            Alert.alert('Error', 'Failed to send OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp.trim()) {
            Alert.alert('Error', 'Please enter the OTP');
            return;
        }

        if (otp.length !== 6) {
            Alert.alert('Error', 'Please enter a valid 6-digit OTP');
            return;
        }

        const result = await verifyOTP({
            mobileNumber: mobileNumber.trim(),
            verificationId,
            otp: otp.trim(),
            isNewUser,
            name: userName,
        });

        if (result.success) {
            // Login successful - user will be automatically navigated by auth context
        } else if (result.isNewUser) {
            setIsNewUser(true);
            Alert.alert('New User', 'Please enter your name to complete registration');
        } else {
            Alert.alert('Error', result.error || 'OTP verification failed');
        }
    };

    const handleResendOTP = () => {
        if (isResendDisabled) return;

        setOtp('');
        setIsResendDisabled(true);
        setResendCountdown(30);
        handleSendOTP();
    };

    const renderDeviceMismatchInfo = () => {
        if (!deviceInfo) return null;

        return (
            <View style={styles.deviceMismatchContainer}>
                <Text style={styles.deviceMismatchTitle}>Account Linked to Another Device</Text>
                <View style={styles.deviceInfoContainer}>
                    <Text style={styles.deviceInfoLabel}>Device Name:</Text>
                    <Text style={styles.deviceInfoValue}>{deviceInfo.deviceName}</Text>
                </View>
                <View style={styles.deviceInfoContainer}>
                    <Text style={styles.deviceInfoLabel}>Manufacturer:</Text>
                    <Text style={styles.deviceInfoValue}>{deviceInfo.manufacturer}</Text>
                </View>
                <View style={styles.deviceInfoContainer}>
                    <Text style={styles.deviceInfoLabel}>Model:</Text>
                    <Text style={styles.deviceInfoValue}>{deviceInfo.modelName}</Text>
                </View>
                <View style={styles.deviceInfoContainer}>
                    <Text style={styles.deviceInfoLabel}>OS Version:</Text>
                    <Text style={styles.deviceInfoValue}>{deviceInfo.osVersion}</Text>
                </View>
                <Text style={styles.deviceMismatchMessage}>
                    Please use the original device to access this account.
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={[COLORS.turquoise, COLORS.white]}
                style={styles.gradient}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <View style={styles.content}>
                            <View style={styles.logoContainer}>
                                <Image
                                    source={require('../../assets/pp1.png')}
                                    style={styles.logo}
                                    resizeMode="contain"
                                />
                            </View>
                            <Text style={styles.title}>PeekPark</Text>
                            <Text style={styles.subtitle}>Welcome Back</Text>

                            {deviceInfo ? (
                                renderDeviceMismatchInfo()
                            ) : (
                                <View>
                                    {!showOTPInput ? (
                                        <View>
                                            <Text style={styles.label}>UAE Mobile Number</Text>
                                            <View style={styles.phoneInputContainer}>
                                                <View style={styles.countryCodeContainer}>
                                                    <UAEFlagIcon size={18} />
                                                    <Text style={styles.countryCode}>+971</Text>
                                                </View>
                                                <TextInput
                                                    style={styles.phoneInput}
                                                    placeholder="568863388"
                                                    value={mobileNumber}
                                                    onChangeText={setMobileNumber}
                                                    keyboardType="numeric"
                                                    maxLength={9}
                                                />
                                            </View>

                                            <TouchableOpacity
                                                style={styles.button}
                                                onPress={handleSendOTP}
                                                disabled={isLoading}
                                            >
                                                {isLoading ? (
                                                    <ActivityIndicator color="white" />
                                                ) : (
                                                    <Text style={styles.buttonText}>Send OTP</Text>
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <View>
                                            <Text style={styles.label}>Enter OTP</Text>
                                            <Text style={styles.otpHint}>
                                                We've sent a 6-digit code to +971 {mobileNumber}
                                            </Text>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Enter 6-digit OTP"
                                                value={otp}
                                                onChangeText={setOtp}
                                                keyboardType="numeric"
                                                maxLength={6}
                                            />

                                            {isNewUser && (
                                                <>
                                                    <Text style={styles.label}>Your Name</Text>
                                                    <TextInput
                                                        style={styles.input}
                                                        placeholder="Enter your full name"
                                                        value={userName}
                                                        onChangeText={setUserName}
                                                    />
                                                </>
                                            )}

                                            <TouchableOpacity
                                                style={styles.button}
                                                onPress={handleVerifyOTP}
                                                disabled={isLoading}
                                            >
                                                {isLoading ? (
                                                    <ActivityIndicator color="white" />
                                                ) : (
                                                    <Text style={styles.buttonText}>
                                                        {isNewUser ? 'Complete Registration' : 'Verify & Login'}
                                                    </Text>
                                                )}
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={[styles.button, styles.resendButton]}
                                                onPress={handleResendOTP}
                                                disabled={isResendDisabled}
                                            >
                                                <Text style={[styles.buttonText, styles.resendButtonText]}>
                                                    {isResendDisabled
                                                        ? `Resend OTP (${resendCountdown}s)`
                                                        : 'Resend OTP'}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}

                                    <TouchableOpacity
                                        style={styles.linkButton}
                                        onPress={() => navigation.navigate('SignUp')}
                                    >
                                        <Text style={styles.linkText}>
                                            Don't have an account? Sign Up
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </LinearGradient>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    content: {
        padding: 20,
        paddingHorizontal: 30,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    logo: {
        width: 120,
        height: 120,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        color: COLORS.primaryText,
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        color: COLORS.primaryText,
        marginBottom: 30,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.primaryText,
        marginBottom: 8,
    },
    otpHint: {
        fontSize: 14,
        color: COLORS.secondaryText,
        marginBottom: 15,
        textAlign: 'center',
    },
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.gray,
        marginBottom: 20,
        paddingHorizontal: 15,
        height: 50,
    },
    countryCodeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 10,
        borderRightWidth: 1,
        borderRightColor: COLORS.gray,
        marginRight: 10,
    },
    countryCode: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.primaryText,
        marginLeft: 8,
    },
    phoneInput: {
        flex: 1,
        fontSize: 16,
        color: COLORS.primaryText,
    },
    input: {
        backgroundColor: 'white',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.gray,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        marginBottom: 20,
        color: COLORS.primaryText,
    },
    button: {
        backgroundColor: COLORS.turquoise,
        borderRadius: 8,
        paddingVertical: 15,
        alignItems: 'center',
        marginBottom: 15,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    resendButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: COLORS.turquoise,
    },
    resendButtonText: {
        color: COLORS.turquoise,
    },
    linkButton: {
        alignItems: 'center',
        marginTop: 20,
    },
    linkText: {
        color: COLORS.turquoise,
        fontSize: 16,
        fontWeight: '600',
    },
    deviceMismatchContainer: {
        backgroundColor: '#FFE6E6',
        padding: 20,
        borderRadius: 10,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#FFB6B6',
    },
    deviceMismatchTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#CC0000',
        marginBottom: 15,
        textAlign: 'center',
    },
    deviceInfoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        paddingVertical: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#FFD6D6',
    },
    deviceInfoLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#800000',
        flex: 1,
    },
    deviceInfoValue: {
        fontSize: 14,
        color: '#CC0000',
        flex: 2,
        textAlign: 'right',
    },
    deviceMismatchMessage: {
        fontSize: 14,
        color: '#800000',
        textAlign: 'center',
        marginTop: 15,
        fontStyle: 'italic',
    },
});

export default LoginScreen;
