import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useAuth } from '../utils/authContext';

const ProfileScreen: React.FC = () => {
    const { user, logout } = useAuth();

    const handleSignOut = () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: () => {
                        logout();
                    },
                },
            ]
        );
    };

    if (!user) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerContent}>
                    <Text style={styles.errorText}>User not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={[COLORS.turquoise, COLORS.white]}
                style={styles.gradient}
            >
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Profile</Text>
                </View>

                <View style={styles.content}>
                    <View style={styles.profileSection}>
                        <View style={styles.avatarContainer}>
                            {user.photo ? (
                                <Image source={{ uri: user.photo }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Ionicons name="person" size={40} color={COLORS.white} />
                                </View>
                            )}
                        </View>

                        <Text style={styles.userName}>{user.name}</Text>
                        <Text style={styles.userMobile}>{user.mobileNumber}</Text>
                    </View>

                    <View style={styles.infoSection}>
                        <View style={styles.infoItem}>
                            <View style={styles.infoIcon}>
                                <Ionicons name="person-outline" size={24} color={COLORS.turquoise} />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Full Name</Text>
                                <Text style={styles.infoValue}>{user.name}</Text>
                            </View>
                        </View>

                        <View style={styles.infoItem}>
                            <View style={styles.infoIcon}>
                                <Ionicons name="call-outline" size={24} color={COLORS.turquoise} />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Mobile Number</Text>
                                <Text style={styles.infoValue}>{user.mobileNumber}</Text>
                            </View>
                        </View>

                        <View style={styles.infoItem}>
                            <View style={styles.infoIcon}>
                                <Ionicons name="mail-outline" size={24} color={COLORS.turquoise} />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Account Status</Text>
                                <Text style={styles.infoValue}>
                                    {user.isLoggedIn ? 'Active' : 'Inactive'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.actionsSection}>
                        <TouchableOpacity style={styles.actionButton} onPress={handleSignOut}>
                            <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
                            <Text style={styles.actionButtonText}>Sign Out</Text>
                        </TouchableOpacity>
                    </View>
                </View>
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
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 18,
        color: COLORS.error,
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.black,
        textAlign: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 30,
    },
    profileSection: {
        alignItems: 'center',
        marginBottom: 40,
    },
    avatarContainer: {
        marginBottom: 20,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: COLORS.white,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.turquoise,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: COLORS.white,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.black,
        marginBottom: 5,
    },
    userMobile: {
        fontSize: 16,
        color: COLORS.secondaryText,
    },
    infoSection: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 20,
        marginBottom: 30,
        shadowColor: COLORS.black,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    infoIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.lightGray,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 14,
        color: COLORS.secondaryText,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.black,
    },
    actionsSection: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 20,
        shadowColor: COLORS.black,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.error,
        marginLeft: 15,
    },
});

export default ProfileScreen; 