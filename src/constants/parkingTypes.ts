import { ParkingTypeConfig } from '../types';
import { COLORS } from './colors';

export const PARKING_TYPES: ParkingTypeConfig[] = [
    {
        type: 'P',
        label: 'Primary Parking',
        color: COLORS.turquoise,
        backgroundColor: COLORS.white,
        icon: 'location-outline',
        iconColor: COLORS.turquoise,
    },
    {
        type: 'S',
        label: 'Standard Parking',
        color: COLORS.black,
        backgroundColor: COLORS.turquoise,
        icon: 'location-outline',
        iconColor: COLORS.black,
    },
    {
        type: 'SR',
        label: 'Standard Residential Parking',
        color: COLORS.black,
        backgroundColor: COLORS.turquoise,
        icon: 'location-outline',
        iconColor: COLORS.black,
    },
];

export const getParkingTypeConfig = (type: string): ParkingTypeConfig | undefined => {
    return PARKING_TYPES.find(parkingType => parkingType.type === type);
}; 