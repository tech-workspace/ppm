import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
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
import { PARKING_TYPES, getParkingTypeConfig } from '../constants/parkingTypes';
import { mockParkingLots, getNearestParkingLots, filterParkingLotsByType } from '../utils/mockData';
import { ParkingLot } from '../types';

interface FindParkingScreenProps {
    navigation: any;
}

const FindParkingScreen: React.FC<FindParkingScreenProps> = ({ navigation }) => {
    const [selectedType, setSelectedType] = useState<string>('all');
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
    const [selectedLot, setSelectedLot] = useState<ParkingLot | null>(null);
    const [showLotModal, setShowLotModal] = useState(false);
    const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [locationStatus, setLocationStatus] = useState<string>('Getting location...');

    // Function to get district name from coordinates (expanded coverage for UAE)
    const getDistrictFromCoordinates = (latitude: number, longitude: number): string => {
        // Dubai districts
        const dubaiDistricts = [
            { name: 'Dubai Marina', latMin: 25.07, latMax: 25.09, lonMin: 55.13, lonMax: 55.15 },
            { name: 'JBR (Jumeirah Beach Residence)', latMin: 25.08, latMax: 25.10, lonMin: 55.12, lonMax: 55.14 },
            { name: 'Downtown Dubai', latMin: 25.19, latMax: 25.21, lonMin: 55.27, lonMax: 55.29 },
            { name: 'Business Bay', latMin: 25.18, latMax: 25.20, lonMin: 55.25, lonMax: 55.27 },
            { name: 'DIFC', latMin: 25.21, latMax: 25.23, lonMin: 55.28, lonMax: 55.30 },
            { name: 'Jumeirah', latMin: 25.22, latMax: 25.24, lonMin: 55.24, lonMax: 55.26 },
            { name: 'Al Barsha', latMin: 25.11, latMax: 25.13, lonMin: 55.19, lonMax: 55.21 },
            { name: 'Dubai Mall Area', latMin: 25.195, latMax: 25.205, lonMin: 55.275, lonMax: 55.285 },
        ];

        // Abu Dhabi districts
        const abuDhabiDistricts = [
            { name: 'Abu Dhabi City Center', latMin: 24.45, latMax: 24.50, lonMin: 54.35, lonMax: 54.40 },
            { name: 'Abu Dhabi Marina', latMin: 24.40, latMax: 24.45, lonMin: 54.48, lonMax: 54.52 },
            { name: 'Corniche Area', latMin: 24.47, latMax: 24.50, lonMin: 54.32, lonMax: 54.37 },
            { name: 'Al Reem Island', latMin: 24.49, latMax: 24.52, lonMin: 54.40, lonMax: 54.43 },
            { name: 'Al Khalidiyah District', latMin: 24.40, latMax: 24.42, lonMin: 54.48, lonMax: 54.50 },
        ];

        // Check Dubai districts first
        for (const district of dubaiDistricts) {
            if (latitude >= district.latMin && latitude <= district.latMax &&
                longitude >= district.lonMin && longitude <= district.lonMax) {
                return district.name;
            }
        }

        // Check Abu Dhabi districts
        for (const district of abuDhabiDistricts) {
            if (latitude >= district.latMin && latitude <= district.latMax &&
                longitude >= district.lonMin && longitude <= district.lonMax) {
                return district.name;
            }
        }

        // Broader area detection
        if (latitude >= 25.0 && latitude <= 25.4 && longitude >= 55.0 && longitude <= 55.5) {
            return 'Dubai Area';
        }
        if (latitude >= 24.2 && latitude <= 24.6 && longitude >= 54.2 && longitude <= 54.7) {
            return 'Abu Dhabi Area';
        }
        if (latitude >= 25.4 && latitude <= 25.6 && longitude >= 55.4 && longitude <= 55.7) {
            return 'Sharjah Area';
        }

        return `Location (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`;
    };

    // Function to render two-color parking type icons
    const renderParkingTypeIcon = (type: any, size: number) => {
        const iconSize = size;
        const borderSize = 2;

        if (type.type === 'P') {
            // Primary: Turquoise and White
            return (
                <View style={{
                    width: iconSize,
                    height: iconSize,
                    borderRadius: iconSize / 2,
                    backgroundColor: COLORS.turquoise,
                    borderWidth: borderSize,
                    borderColor: COLORS.white,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <Text style={{
                        color: COLORS.white,
                        fontSize: iconSize * 0.5,
                        fontWeight: 'bold',
                    }}>P</Text>
                </View>
            );
        } else if (type.type === 'S') {
            // Standard: Turquoise and Black
            return (
                <View style={{
                    width: iconSize,
                    height: iconSize,
                    borderRadius: iconSize / 2,
                    backgroundColor: COLORS.turquoise,
                    borderWidth: borderSize,
                    borderColor: COLORS.black,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <Text style={{
                        color: COLORS.black,
                        fontSize: iconSize * 0.4,
                        fontWeight: 'bold',
                    }}>S</Text>
                </View>
            );
        } else if (type.type === 'SR') {
            // Standard Residential: Turquoise and Black with different design
            return (
                <View style={{
                    width: iconSize,
                    height: iconSize,
                    borderRadius: iconSize / 2,
                    backgroundColor: COLORS.black,
                    borderWidth: borderSize,
                    borderColor: COLORS.turquoise,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <Text style={{
                        color: COLORS.turquoise,
                        fontSize: iconSize * 0.3,
                        fontWeight: 'bold',
                    }}>SR</Text>
                </View>
            );
        }

        // Fallback to single color icon
        return (
            <Ionicons
                name={type.icon as any || 'location-outline'}
                size={iconSize}
                color={type.iconColor || COLORS.turquoise}
            />
        );
    };

    useEffect(() => {
        getCurrentLocation();
    }, []);

    const getCurrentLocation = async () => {
        setIsLoadingLocation(true);
        setLocationStatus('Requesting location permission...');

        try {
            // First check if location services are enabled
            const isEnabled = await Location.hasServicesEnabledAsync();
            if (!isEnabled) {
                console.log('Location services are disabled');
                setLocationStatus('Location services disabled - using default location');
                // Use default location for demo
                setUserLocation({
                    coords: {
                        latitude: 25.2048,
                        longitude: 55.2708,
                        altitude: null,
                        accuracy: null,
                        altitudeAccuracy: null,
                        heading: null,
                        speed: null,
                    },
                    timestamp: Date.now(),
                });
                setIsLoadingLocation(false);
                return;
            }

            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.log('Location permission denied, using default location');
                setLocationStatus('Permission denied - using default location (Dubai)');
                // Use default location for demo instead of showing error
                setUserLocation({
                    coords: {
                        latitude: 25.2048,
                        longitude: 55.2708,
                        altitude: null,
                        accuracy: null,
                        altitudeAccuracy: null,
                        heading: null,
                        speed: null,
                    },
                    timestamp: Date.now(),
                });
                setIsLoadingLocation(false);
                return;
            }

            setLocationStatus('Getting your location...');

            // Try to get location with timeout
            const locationPromise = Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
                timeInterval: 5000,
            });

            // Add a timeout of 15 seconds
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Location timeout')), 15000);
            });

            const location = await Promise.race([locationPromise, timeoutPromise]) as any;

            setUserLocation(location);
            const districtName = getDistrictFromCoordinates(location.coords.latitude, location.coords.longitude);
            setLocationStatus(`Location found: ${districtName}`);
            console.log('Location obtained successfully:', location.coords);
        } catch (error) {
            console.error('Error getting location:', error);
            setLocationStatus('Using default location: Dubai Marina');
            // Use default location for demo
            setUserLocation({
                coords: {
                    latitude: 25.2048,
                    longitude: 55.2708,
                    altitude: null,
                    accuracy: null,
                    altitudeAccuracy: null,
                    heading: null,
                    speed: null,
                },
                timestamp: Date.now(),
            });
        } finally {
            setIsLoadingLocation(false);
        }
    };

    const handleFindParking = () => {
        // Always use a location - either real or default
        const locationToUse = userLocation || {
            coords: {
                latitude: 25.2048,
                longitude: 55.2708,
            },
        };

        const nearestLots = getNearestParkingLots(
            { latitude: locationToUse.coords.latitude, longitude: locationToUse.coords.longitude },
            10
        );

        const filteredLots = filterParkingLotsByType(nearestLots, selectedType);
        setParkingLots(filteredLots);

        console.log(`Found ${filteredLots.length} parking lots near location:`, locationToUse.coords);
    };

    const handleLotPress = (lot: ParkingLot) => {
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

    const renderParkingLot = ({ item }: { item: ParkingLot }) => {
        const typeConfig = getParkingTypeConfig(item.type);

        return (
            <TouchableOpacity style={styles.lotCard} onPress={() => handleLotPress(item)}>
                <View style={styles.lotHeader}>
                    <View style={styles.lotTypeContainer}>
                        {typeConfig ? renderParkingTypeIcon(typeConfig, 20) : (
                            <Ionicons
                                name="location-outline"
                                size={20}
                                color={COLORS.turquoise}
                            />
                        )}
                        <Text style={styles.lotType}>{typeConfig?.label || item.type}</Text>
                    </View>
                    <Text style={styles.lotPrice}>AED {item.price}/hr</Text>
                </View>

                <Text style={styles.lotName}>{item.name}</Text>

                <View style={styles.lotDetails}>
                    <Text style={styles.lotDetail}>
                        📍 {item.zoneName}, {item.sectorName}
                    </Text>
                    <Text style={styles.lotDetail}>
                        🛣️ {item.streetName}
                    </Text>
                    <Text style={styles.lotDetail}>
                        🚗 {item.availableSpots}/{item.totalSpots} spots available
                    </Text>
                    {item.distance && (
                        <Text style={styles.lotDetail}>
                            📏 {item.distance} km away
                        </Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={[COLORS.turquoise, COLORS.white]}
                style={styles.gradient}
            >
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Find Parking</Text>
                </View>

                <View style={styles.content}>
                    <View style={styles.filterSection}>
                        <TouchableOpacity
                            style={styles.typeSelector}
                            onPress={() => setShowTypeModal(true)}
                        >
                            <Text style={styles.typeSelectorText}>
                                {selectedType === 'all' ? 'All Parking Types' :
                                    PARKING_TYPES.find(t => t.type === selectedType)?.label || 'Select Type'}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color={COLORS.black} />
                        </TouchableOpacity>

                        <View style={styles.locationStatusContainer}>
                            <Text style={styles.locationStatusText}>{locationStatus}</Text>
                            {isLoadingLocation && (
                                <View style={styles.loadingIndicator}>
                                    <Ionicons name="refresh" size={16} color={COLORS.turquoise} />
                                </View>
                            )}
                        </View>

                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={[styles.locationButton, isLoadingLocation && styles.disabledButton]}
                                onPress={getCurrentLocation}
                                disabled={isLoadingLocation}
                            >
                                <Ionicons name="locate" size={16} color={COLORS.white} />
                                <Text style={styles.locationButtonText}>
                                    {isLoadingLocation ? 'Getting...' : 'Update'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.findButton} onPress={handleFindParking}>
                                <Ionicons name="search" size={20} color={COLORS.white} />
                                <Text style={styles.findButtonText}>Find Parking</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <FlatList
                        data={parkingLots}
                        renderItem={renderParkingLot}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.listContainer}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="car-outline" size={60} color={COLORS.secondaryText} />
                                <Text style={styles.emptyText}>No parking lots found</Text>
                                <Text style={styles.emptySubtext}>Tap "Find Parking" to search nearby lots</Text>
                            </View>
                        }
                    />
                </View>

                {/* Parking Type Modal */}
                <Modal
                    visible={showTypeModal}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowTypeModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Select Parking Type</Text>
                                <TouchableOpacity onPress={() => setShowTypeModal(false)}>
                                    <Ionicons name="close" size={24} color={COLORS.black} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView>
                                <TouchableOpacity
                                    style={styles.typeOption}
                                    onPress={() => {
                                        setSelectedType('all');
                                        setShowTypeModal(false);
                                    }}
                                >
                                    <Text style={styles.typeOptionText}>All Parking Types</Text>
                                </TouchableOpacity>

                                {PARKING_TYPES.map((type) => (
                                    <TouchableOpacity
                                        key={type.type}
                                        style={styles.typeOption}
                                        onPress={() => {
                                            setSelectedType(type.type);
                                            setShowTypeModal(false);
                                        }}
                                    >
                                        {renderParkingTypeIcon(type, 24)}
                                        <Text style={styles.typeOptionText}>{type.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>

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
        paddingTop: 20,
    },
    filterSection: {
        marginBottom: 20,
    },
    typeSelector: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    typeSelectorText: {
        fontSize: 16,
        color: COLORS.black,
    },
    locationStatusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.cardBackground,
        borderRadius: 8,
        padding: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    locationStatusText: {
        fontSize: 14,
        color: COLORS.secondaryText,
        textAlign: 'center',
        flex: 1,
    },
    loadingIndicator: {
        marginLeft: 8,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 10,
    },
    disabledButton: {
        opacity: 0.6,
    },
    locationButton: {
        backgroundColor: COLORS.secondaryText,
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
        minHeight: 56,
        shadowColor: COLORS.black,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    locationButtonText: {
        color: COLORS.white,
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 4,
        textAlign: 'center',
        flexShrink: 1,
    },
    findButton: {
        backgroundColor: COLORS.turquoise,
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1.5,
        minHeight: 56,
        shadowColor: COLORS.black,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    findButtonText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 8,
    },
    listContainer: {
        paddingBottom: 20,
    },
    lotCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 20,
        marginBottom: 15,
        shadowColor: COLORS.black,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    lotHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    lotTypeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    lotType: {
        fontSize: 14,
        color: COLORS.secondaryText,
    },
    lotPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.turquoise,
    },
    lotName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.black,
        marginBottom: 10,
    },
    lotDetails: {
        gap: 5,
    },
    lotDetail: {
        fontSize: 14,
        color: COLORS.secondaryText,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.secondaryText,
        marginTop: 15,
    },
    emptySubtext: {
        fontSize: 14,
        color: COLORS.secondaryText,
        marginTop: 5,
        textAlign: 'center',
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
    typeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },

    typeOptionText: {
        fontSize: 16,
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

export default FindParkingScreen; 