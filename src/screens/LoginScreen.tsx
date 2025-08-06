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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/colors';
import { useAuth } from '../utils/authContext';

interface LoginScreenProps {
    navigation: any;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
    const [mobileNumber, setMobileNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [showOTPInput, setShowOTPInput] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { login, verifyOTP } = useAuth();
    // Debug useEffect to monitor showOTPInput changes
    useEffect(() => {
        console.log('showOTPInput changed to:', showOTPInput);
    }, [showOTPInput]);

    const handleSendOTP = async () => {
        if (!mobileNumber.trim()) {
            Alert.alert('Error', 'Please enter your mobile number');
            return;
        }

        if (mobileNumber.length < 10) {
            Alert.alert('Error', 'Please enter a valid mobile number');
            return;
        }

        setIsLoading(true);
        try {
            const success = await login(mobileNumber.trim());
            console.log('Login result:', success);
            if (success) {
                // Set state immediately
                setShowOTPInput(true);
                console.log('showOTPInput set to true immediately');

                // Show alert after a delay to ensure state update is processed
                setTimeout(() => {
                    Alert.alert(
                        'OTP Sent Successfully!',
                        'Please enter the OTP code below.\n\n💡 Demo OTP: 123456'
                    );
                }, 100);
            } else {
                Alert.alert('Error', 'Something went wrong. Please try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp.trim() || otp.length !== 6) {
            Alert.alert('Error', 'Please enter a valid 6-digit OTP');
            return;
        }

        setIsLoading(true);
        try {
            const success = await verifyOTP(otp.trim());
            if (success) {
                Alert.alert('Success', 'Login successful!');
                // Navigation will be handled by the main app based on auth state
            } else {
                Alert.alert('Error', 'Invalid OTP. Please try again.');
            }
        } catch (error) {
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (!mobileNumber.trim()) {
            Alert.alert('Error', 'Please enter your mobile number first');
            return;
        }

        setIsLoading(true);
        try {
            const success = await login(mobileNumber.trim());
            if (success) {
                Alert.alert('OTP Resent', 'Please check your phone for the new OTP code');
            } else {
                Alert.alert('Error', 'Failed to resend OTP. Please try again.');
            }
        } catch (error) {
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    console.log('Rendering LoginScreen, showOTPInput:', showOTPInput);
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
                            <Text style={styles.title}>PeekPark</Text>
                            <Text style={styles.subtitle}>Welcome Back</Text>

                            <View style={styles.form}>
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
                                        editable={!showOTPInput}
                                    />
                                </View>

                                {!showOTPInput ? (
                                    <TouchableOpacity
                                        style={[styles.button, isLoading && styles.buttonDisabled]}
                                        onPress={handleSendOTP}
                                        disabled={isLoading}
                                    >
                                        <Text style={styles.buttonText}>
                                            {isLoading ? 'Sending OTP...' : 'Send OTP'}
                                        </Text>
                                    </TouchableOpacity>
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
                                                keyboardType="number-pad"
                                                maxLength={6}
                                            />
                                        </View>

                                        <TouchableOpacity
                                            style={[styles.button, isLoading && styles.buttonDisabled]}
                                            onPress={handleVerifyOTP}
                                            disabled={isLoading}
                                        >
                                            <Text style={styles.buttonText}>
                                                {isLoading ? 'Verifying...' : 'Verify OTP'}
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.resendButton}
                                            onPress={handleResendOTP}
                                            disabled={isLoading}
                                        >
                                            <Text style={styles.resendText}>Resend OTP</Text>
                                        </TouchableOpacity>
                                    </>
                                )}

                                <View style={styles.signupContainer}>
                                    <Text style={styles.signupText}>Don't have an account? </Text>
                                    <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                                        <Text style={styles.signupLink}>Sign Up</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
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
        paddingVertical: 10,
    },
    resendText: {
        color: COLORS.turquoise,
        fontSize: 16,
        fontWeight: '600',
    },
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 30,
    },
    signupText: {
        color: COLORS.secondaryText,
        fontSize: 16,
    },
    signupLink: {
        color: COLORS.turquoise,
        fontSize: 16,
        fontWeight: '600',
    },
});

export default LoginScreen; 