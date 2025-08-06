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
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

// Import react-native-maps with error handling
let MapView: any;
let Marker: any;
let Region: any;

try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    Region = Maps.Region;
} catch (error) {
    console.warn('react-native-maps not available:', error);
}
import { COLORS } from '../constants/colors';
import { getParkingTypeConfig } from '../constants/parkingTypes';
import { mockParkingLots, getNearestParkingLots } from '../utils/mockData';
import { ParkingLot, Location as LocationType } from '../types';

interface InteractiveMapScreenProps {
    navigation: any;
    route: any;
}

// Function to render two-color parking type icons
const renderParkingTypeIcon = (type: any, size: number) => {
    const iconSize = size;
    const borderSize = 1;

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
                    fontSize: iconSize * 0.25,
                    fontWeight: 'bold',
                }}>SR</Text>
            </View>
        );
    }

    // Fallback to single color icon
    return (
        <Ionicons
            name="location-outline"
            size={iconSize}
            color={COLORS.turquoise}
        />
    );
};

const InteractiveMapScreen: React.FC<InteractiveMapScreenProps> = ({ navigation, route }) => {
    const [userLocation, setUserLocation] = useState<LocationType | null>(null);
    const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
    const [selectedLot, setSelectedLot] = useState<ParkingLot | null>(null);
    const [showLotModal, setShowLotModal] = useState(false);
    const [region, setRegion] = useState<any>({
        latitude: 24.4539,
        longitude: 54.3773,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    });

    useEffect(() => {
        getCurrentLocation();
        loadParkingLots();
    }, []); // Only run once on component mount

    // Separate useEffect for route params
    useEffect(() => {
        if (route.params?.selectedLot) {
            setSelectedLot(route.params.selectedLot);
            setShowLotModal(true);
        }
    }, [route.params?.selectedLot]);

    const getCurrentLocation = React.useCallback(async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.log('Location permission denied, using default location');
                // Use default location for demo instead of showing error
                const defaultLocation = {
                    latitude: 24.4539,
                    longitude: 54.3773,
                };
                setUserLocation(defaultLocation);
                setRegion({
                    latitude: defaultLocation.latitude,
                    longitude: defaultLocation.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                });
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
            setRegion({
                latitude: userLoc.latitude,
                longitude: userLoc.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            });
            console.log('Location obtained successfully:', userLoc);
        } catch (error) {
            console.error('Error getting location:', error);
            // Use default location for demo
            const defaultLocation = {
                latitude: 24.4539,
                longitude: 54.3773,
            };
            setUserLocation(defaultLocation);
            setRegion({
                latitude: defaultLocation.latitude,
                longitude: defaultLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            });
        }
    }, []);

    const loadParkingLots = React.useCallback(() => {
        const nearestLots = getNearestParkingLots(
            { latitude: 24.4539, longitude: 54.3773 },
            10
        );
        setParkingLots(nearestLots);
    }, []);

    const handleMarkerPress = React.useCallback((lot: ParkingLot) => {
        setSelectedLot(lot);
        setShowLotModal(true);
    }, []);

    const handleNavigate = React.useCallback(() => {
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
    }, [selectedLot]);

    const renderParkingMarker = React.useCallback((lot: ParkingLot) => {
        const typeConfig = getParkingTypeConfig(lot.type);
        console.log('Rendering marker for lot:', lot.name, 'type:', lot.type);

        return (
            <Marker
                key={lot.id}
                coordinate={{
                    latitude: lot.latitude,
                    longitude: lot.longitude,
                }}
                onPress={() => handleMarkerPress(lot)}
            >
                <View style={[styles.markerContainer, {
                    backgroundColor: typeConfig?.backgroundColor || COLORS.white,
                    borderColor: typeConfig?.color || COLORS.turquoise
                }]}>
                    <View style={styles.markerContent}>
                        {typeConfig ? renderParkingTypeIcon(typeConfig, 8) : (
                            <Ionicons
                                name="location-outline"
                                size={8}
                                color={COLORS.turquoise}
                            />
                        )}
                        <Text style={[styles.markerType, { color: typeConfig?.iconColor || COLORS.turquoise }]}>
                            {lot.type}
                        </Text>
                    </View>
                </View>
            </Marker>
        );
    }, [handleMarkerPress]);

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
                    {Platform.OS === 'web' || !MapView ? (
                        <View style={styles.mapFallback}>
                            <Ionicons name="map-outline" size={80} color={COLORS.secondaryText} />
                            <Text style={styles.mapFallbackTitle}>Interactive Map</Text>
                            <Text style={styles.mapFallbackText}>
                                Map functionality is available on mobile devices only.
                            </Text>
                            <Text style={styles.mapFallbackSubtext}>
                                Please use the Expo Go app or a mobile simulator to view the interactive map.
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
                                            {getParkingTypeConfig(lot.type) ?
                                                renderParkingTypeIcon(getParkingTypeConfig(lot.type)!, 20) :
                                                <Ionicons
                                                    name="location-outline"
                                                    size={20}
                                                    color={COLORS.turquoise}
                                                />
                                            }
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
                    ) : (
                        <MapView
                            style={styles.map}
                            region={region}
                            showsUserLocation={true}
                            showsMyLocationButton={false}
                            showsCompass={true}
                            showsScale={true}
                            showsTraffic={false}
                            showsBuildings={true}
                            mapType="standard"
                        >
                            {parkingLots.map(renderParkingMarker)}
                        </MapView>
                    )}
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
    map: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height - 100, // Adjust for header
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
        marginLeft: 34,
    },
    markerContainer: {
        backgroundColor: COLORS.white,
        borderRadius: 15,
        width: 30,
        height: 30,
        borderWidth: 2,
        borderColor: COLORS.turquoise,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.black,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },

    markerContent: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },

    markerType: {
        fontSize: 7,
        fontWeight: 'bold',
        marginTop: 1,
        textAlign: 'center',
        includeFontPadding: false,
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