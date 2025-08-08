import React, { useState } from 'react';
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
import { SignupFormData, DeviceInfo } from '../types';

interface SignUpScreenProps {
    navigation: any;
}

const SignUpScreen: React.FC<SignUpScreenProps> = ({ navigation }) => {
    const [name, setName] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [verificationId, setVerificationId] = useState('');
    const [showOTPInput, setShowOTPInput] = useState(false);
    const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
    const [isResendDisabled, setIsResendDisabled] = useState(false);
    const [resendCountdown, setResendCountdown] = useState(0);
    const { sendOTP, verifyOTP, isLoading } = useAuth();

    // Countdown timer for resend OTP
    React.useEffect(() => {
        let interval: NodeJS.Timeout;
        if (resendCountdown > 0) {
            interval = setInterval(() => {
                setResendCountdown((prev) => {
                    if (prev <= 1) {
                        setIsResendDisabled(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendCountdown]);

    const handleSendOTP = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter your full name');
            return;
        }

        if (!mobileNumber.trim()) {
            Alert.alert('Error', 'Please enter your mobile number');
            return;
        }

        if (mobileNumber.length < 10) {
            Alert.alert('Error', 'Please enter a valid mobile number');
            return;
        }

        const result = await sendOTP({ mobileNumber: mobileNumber.trim() });

        if (result.success && result.verificationId) {
            setVerificationId(result.verificationId);
            setShowOTPInput(true);
            setIsResendDisabled(true);
            setResendCountdown(30); // 30 seconds cooldown
            Alert.alert('Success', 'OTP sent successfully! Please check your phone for the verification code.');
        } else {
            if (result.deviceInfo) {
                // Device mismatch - show detailed error
                setDeviceInfo(result.deviceInfo);
                Alert.alert(
                    'Device Restriction',
                    result.error || 'This account is linked to another device.',
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                setDeviceInfo(null);
                                setMobileNumber('');
                            }
                        }
                    ]
                );
            } else {
                Alert.alert('Error', result.error || 'Failed to send OTP');
            }
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
            otp: otp.trim()
        }, name.trim());

        if (result.success && result.user) {
            Alert.alert(
                'Success',
                'Account created successfully! You are now logged in.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            // Navigation will be handled by the main app based on auth state
                        },
                    },
                ]
            );
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
                <Text style={styles.deviceMismatchTitle}>Account Already Exists</Text>
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
                    This mobile number is already registered. Please login instead.
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
                            <Text style={styles.subtitle}>Create Your Account</Text>

                            {deviceInfo ? (
                                renderDeviceMismatchInfo()
                            ) : (
                                <View style={styles.form}>
                                    {!showOTPInput ? (
                                        <>
                                            <View style={styles.inputContainer}>
                                                <Text style={styles.label}>Full Name</Text>
                                                <TextInput
                                                    style={styles.input}
                                                    placeholder="Enter your full name"
                                                    placeholderTextColor={COLORS.secondaryText}
                                                    value={name}
                                                    onChangeText={setName}
                                                    autoCapitalize="words"
                                                    editable={!isLoading}
                                                />
                                            </View>

                                            <View style={styles.inputContainer}>
                                                <Text style={styles.label}>Mobile Number</Text>
                                                <TextInput
                                                    style={styles.input}
                                                    placeholder="Enter your mobile number"
                                                    placeholderTextColor={COLORS.secondaryText}
                                                    value={mobileNumber}
                                                    onChangeText={setMobileNumber}
                                                    keyboardType="phone-pad"
                                                    maxLength={15}
                                                    editable={!isLoading}
                                                />
                                                <Text style={styles.inputHint}>
                                                    Include country code (e.g., +1 for US)
                                                </Text>
                                            </View>

                                            <TouchableOpacity
                                                style={[styles.button, isLoading && styles.buttonDisabled]}
                                                onPress={handleSendOTP}
                                                disabled={isLoading}
                                            >
                                                {isLoading ? (
                                                    <ActivityIndicator color={COLORS.white} size="small" />
                                                ) : (
                                                    <Text style={styles.buttonText}>Send OTP</Text>
                                                )}
                                            </TouchableOpacity>
                                        </>
                                    ) : (
                                        <>
                                            <View style={styles.inputContainer}>
                                                <Text style={styles.label}>OTP Code</Text>
                                                <TextInput
                                                    style={styles.input}
                                                    placeholder="Enter 6-digit OTP"
                                                    placeholderTextColor={COLORS.secondaryText}
                                                    value={otp}
                                                    onChangeText={setOtp}
                                                    keyboardType="numeric"
                                                    maxLength={6}
                                                    editable={!isLoading}
                                                />
                                                <Text style={styles.inputHint}>
                                                    Enter the 6-digit code sent to your phone
                                                </Text>
                                            </View>

                                            <TouchableOpacity
                                                style={[styles.button, isLoading && styles.buttonDisabled]}
                                                onPress={handleVerifyOTP}
                                                disabled={isLoading}
                                            >
                                                {isLoading ? (
                                                    <ActivityIndicator color={COLORS.white} size="small" />
                                                ) : (
                                                    <Text style={styles.buttonText}>Create Account</Text>
                                                )}
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={[styles.resendButton, isResendDisabled && styles.resendButtonDisabled]}
                                                onPress={handleResendOTP}
                                                disabled={isResendDisabled || isLoading}
                                            >
                                                <Text style={[styles.resendText, isResendDisabled && styles.resendTextDisabled]}>
                                                    {isResendDisabled
                                                        ? `Resend OTP (${resendCountdown}s)`
                                                        : 'Resend OTP'
                                                    }
                                                </Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={styles.backButton}
                                                onPress={() => {
                                                    setShowOTPInput(false);
                                                    setOtp('');
                                                    setIsResendDisabled(false);
                                                    setResendCountdown(0);
                                                }}
                                            >
                                                <Text style={styles.backText}>Back to Details</Text>
                                            </TouchableOpacity>
                                        </>
                                    )}

                                    <View style={styles.loginContainer}>
                                        <Text style={styles.loginText}>Already have an account? </Text>
                                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                            <Text style={styles.loginLink}>Login</Text>
                                        </TouchableOpacity>
                                    </View>
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
        paddingHorizontal: 30,
        paddingVertical: 20,
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
        color: COLORS.black,
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        color: COLORS.secondaryText,
        textAlign: 'center',
        marginBottom: 40,
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.black,
        marginBottom: 8,
    },
    input: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: COLORS.black,
    },
    inputHint: {
        fontSize: 12,
        color: COLORS.secondaryText,
        marginTop: 4,
        fontStyle: 'italic',
    },
    button: {
        backgroundColor: COLORS.turquoise,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: COLORS.black,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: '600',
    },
    resendButton: {
        alignItems: 'center',
        marginTop: 15,
    },
    resendButtonDisabled: {
        opacity: 0.5,
    },
    resendText: {
        color: COLORS.turquoise,
        fontSize: 14,
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
    resendTextDisabled: {
        color: COLORS.secondaryText,
        textDecorationLine: 'none',
    },
    backButton: {
        alignItems: 'center',
        marginTop: 10,
    },
    backText: {
        color: COLORS.secondaryText,
        fontSize: 14,
        opacity: 0.8,
    },
    deviceMismatchContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 15,
        padding: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: COLORS.black,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    deviceMismatchTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.black,
        textAlign: 'center',
        marginBottom: 20,
    },
    deviceInfoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    deviceInfoLabel: {
        fontSize: 14,
        color: COLORS.secondaryText,
    },
    deviceInfoValue: {
        fontSize: 14,
        color: COLORS.black,
        fontWeight: '600',
    },
    deviceMismatchMessage: {
        fontSize: 14,
        color: COLORS.secondaryText,
        textAlign: 'center',
        marginTop: 15,
        fontStyle: 'italic',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 30,
    },
    loginText: {
        color: COLORS.secondaryText,
        fontSize: 16,
    },
    loginLink: {
        color: COLORS.turquoise,
        fontSize: 16,
        fontWeight: '600',
    },
});

export default SignUpScreen; 