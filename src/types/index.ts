export interface User {
    id: string;
    name: string;
    mobileNumber: string;
    photo?: string;
    isLoggedIn: boolean;
}

export interface ParkingLot {
    id: string;
    name: string;
    type: ParkingType;
    color: string;
    price: number;
    zoneName: string;
    sectorName: string;
    streetName: string;
    totalSpots: number;
    availableSpots: number;
    latitude: number;
    longitude: number;
    distance?: number;
}

export type ParkingType = 'P' | 'S' | 'SR' | 'VG';

export interface ParkingTypeConfig {
    type: ParkingType;
    label: string;
    color: string;
    backgroundColor: string;
    icon: string;
    iconColor: string;
}

export interface Location {
    latitude: number;
    longitude: number;
}

export interface NavigationProps {
    navigation: any;
    route: any;
}

export interface TabNavigationProps {
    navigation: any;
} 