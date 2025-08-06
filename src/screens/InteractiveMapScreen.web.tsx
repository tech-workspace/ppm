import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Modal,
    ScrollView,
    Linking,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS } from '../constants/colors';
import { getParkingTypeConfig } from '../constants/parkingTypes';
import { mockParkingLots, getNearestParkingLots } from '../utils/mockData';
import { ParkingLot, Location as LocationType } from '../types';

interface InteractiveMapScreenProps {
    navigation: any;
    route: any;
}

const InteractiveMapScreen: React.FC<InteractiveMapScreenProps> = ({ navigation, route }) => {
    const [userLocation, setUserLocation] = useState<LocationType | null>(null);
    const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
    const [selectedLot, setSelectedLot] = useState<ParkingLot | null>(null);
    const [showLotModal, setShowLotModal] = useState(false);

    useEffect(() => {
        getCurrentLocation();
        loadParkingLots();

        // Check if we have a selected lot from navigation
        if (route.params?.selectedLot) {
            setSelectedLot(route.params.selectedLot);
            setShowLotModal(true);
        }
    }, [route.params]);

    const getCurrentLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.log('Location permission denied, using default location');
                // Use default location for demo instead of showing error
                const defaultLocation = {
                    latitude: 25.2048,
                    longitude: 55.2708,
                };
                setUserLocation(defaultLocation);
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
                timeInterval: 5000,
            });
            const userLoc = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };

            setUserLocation(userLoc);
            console.log('Location obtained successfully:', userLoc);
        } catch (error) {
            console.error('Error getting location:', error);
            // Use default location for demo
            const defaultLocation = {
                latitude: 25.2048,
                longitude: 55.2708,
            };
            setUserLocation(defaultLocation);
        }
    };

    const loadParkingLots = () => {
        const nearestLots = getNearestParkingLots(
            { latitude: 25.2048, longitude: 55.2708 },
            10
        );
        setParkingLots(nearestLots);
    };

    const handleMarkerPress = (lot: ParkingLot) => {
        setSelectedLot(lot);
        setShowLotModal(true);
    };

    const handleNavigate = () => {
        if (selectedLot) {
            setShowLotModal(false);

            // Create navigation URL for Google Maps
            const destination = `${selectedLot.latitude},${selectedLot.longitude}`;
            const destinationName = encodeURIComponent(selectedLot.name);

            let navigationUrl = '';

            if (Platform.OS === 'ios') {
                // iOS: Use Apple Maps
                navigationUrl = `http://maps.apple.com/?daddr=${destination}&dirflg=d`;
            } else {
                // Android: Use Google Maps
                navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&destination_place_id=${destinationName}&travelmode=driving`;
            }

            // Try to open the navigation app
            Linking.canOpenURL(navigationUrl).then((supported) => {
                if (supported) {
                    return Linking.openURL(navigationUrl);
                } else {
                    // Fallback to Google Maps web
                    const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${destination}`;
                    return Linking.openURL(fallbackUrl);
                }
            }).then(() => {
                console.log('Navigation opened successfully');
            }).catch((error) => {
                console.error('Error opening navigation:', error);
                Alert.alert(
                    'Navigation Error',
                    'Unable to open navigation app. Please try again.',
                    [{ text: 'OK' }]
                );
            });
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={[COLORS.turquoise, COLORS.white]}
                style={styles.gradient}
            >
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Interactive Map</Text>
                    <TouchableOpacity
                        style={styles.myLocationButton}
                        onPress={getCurrentLocation}
                    >
                        <Ionicons name="locate" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                </View>

                <View style={styles.mapContainer}>
                    <View style={styles.mapFallback}>
                        <Ionicons name="map-outline" size={80} color={COLORS.secondaryText} />
                        <Text style={styles.mapFallbackTitle}>Interactive Map</Text>
                        <Text style={styles.mapFallbackText}>
                            Map functionality is available on mobile devices only.
                        </Text>
                        <Text style={styles.mapFallbackSubtext}>
                            Please use the Expo Go app or a mobile simulator to view the interactive map with Google Maps.
                        </Text>

                        <View style={styles.parkingLotsList}>
                            <Text style={styles.parkingLotsTitle}>Nearby Parking Lots:</Text>
                            {parkingLots.slice(0, 5).map((lot) => (
                                <TouchableOpacity
                                    key={lot.id}
                                    style={styles.parkingLotItem}
                                    onPress={() => handleMarkerPress(lot)}
                                >
                                    <View style={styles.lotItemHeader}>
                                        <Text style={styles.lotItemIcon}>
                                            {getParkingTypeConfig(lot.type)?.icon || '🚗'}
                                        </Text>
                                        <Text style={styles.lotItemName}>{lot.name}</Text>
                                        <Text style={styles.lotItemPrice}>AED {lot.price}/hr</Text>
                                    </View>
                                    <Text style={styles.lotItemDetails}>
                                        {lot.zoneName}, {lot.sectorName} • {lot.availableSpots}/{lot.totalSpots} spots
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Parking Lot Details Modal */}
                <Modal
                    visible={showLotModal}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowLotModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            {selectedLot && (
                                <>
                                    <View style={styles.modalHeader}>
                                        <Text style={styles.modalTitle}>Parking Lot Details</Text>
                                        <TouchableOpacity onPress={() => setShowLotModal(false)}>
                                            <Ionicons name="close" size={24} color={COLORS.black} />
                                        </TouchableOpacity>
                                    </View>

                                    <ScrollView style={styles.lotDetailsModal}>
                                        <Text style={styles.lotDetailTitle}>{selectedLot.name}</Text>

                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Type:</Text>
                                            <Text style={styles.detailValue}>
                                                {getParkingTypeConfig(selectedLot.type)?.label}
                                            </Text>
                                        </View>

                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Price:</Text>
                                            <Text style={styles.detailValue}>AED {selectedLot.price}/hour</Text>
                                        </View>

                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Zone:</Text>
                                            <Text style={styles.detailValue}>{selectedLot.zoneName}</Text>
                                        </View>

                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Sector:</Text>
                                            <Text style={styles.detailValue}>{selectedLot.sectorName}</Text>
                                        </View>

                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Street:</Text>
                                            <Text style={styles.detailValue}>{selectedLot.streetName}</Text>
                                        </View>

                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Available Spots:</Text>
                                            <Text style={styles.detailValue}>
                                                {selectedLot.availableSpots}/{selectedLot.totalSpots}
                                            </Text>
                                        </View>

                                        {selectedLot.distance && (
                                            <View style={styles.detailRow}>
                                                <Text style={styles.detailLabel}>Distance:</Text>
                                                <Text style={styles.detailValue}>{selectedLot.distance} km</Text>
                                            </View>
                                        )}

                                        <TouchableOpacity style={styles.navigateButton} onPress={handleNavigate}>
                                            <Ionicons name="navigate" size={20} color={COLORS.white} />
                                            <Text style={styles.navigateButtonText}>Navigate</Text>
                                        </TouchableOpacity>
                                    </ScrollView>
                                </>
                            )}
                        </View>
                    </View>
                </Modal>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.black,
    },
    myLocationButton: {
        backgroundColor: COLORS.turquoise,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.black,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    mapContainer: {
        flex: 1,
    },
    mapFallback: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: COLORS.white,
    },
    mapFallbackTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.black,
        marginTop: 20,
        marginBottom: 10,
    },
    mapFallbackText: {
        fontSize: 16,
        color: COLORS.secondaryText,
        textAlign: 'center',
        marginBottom: 5,
    },
    mapFallbackSubtext: {
        fontSize: 14,
        color: COLORS.secondaryText,
        textAlign: 'center',
        marginBottom: 30,
    },
    parkingLotsList: {
        width: '100%',
        maxWidth: 400,
    },
    parkingLotsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.black,
        marginBottom: 15,
        textAlign: 'center',
    },
    parkingLotItem: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    lotItemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    lotItemIcon: {
        fontSize: 20,
        marginRight: 10,
    },
    lotItemName: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.black,
    },
    lotItemPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.turquoise,
    },
    lotItemDetails: {
        fontSize: 14,
        color: COLORS.secondaryText,
        marginLeft: 30,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.black,
    },
    lotDetailsModal: {
        padding: 20,
    },
    lotDetailTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.black,
        marginBottom: 20,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    detailLabel: {
        fontSize: 16,
        color: COLORS.secondaryText,
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 16,
        color: COLORS.black,
        fontWeight: '600',
    },
    navigateButton: {
        backgroundColor: COLORS.turquoise,
        borderRadius: 12,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    navigateButtonText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 8,
    },
});

export default InteractiveMapScreen; 