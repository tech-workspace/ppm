import { ParkingLot, User } from '../types';

// Mock user data
export const mockUser: User = {
    id: '1',
    name: 'John Doe',
    mobileNumber: '+971501234567',
    photo: 'https://via.placeholder.com/100',
    isLoggedIn: false,
};

// Mock parking lots data
export const mockParkingLots: ParkingLot[] = [
    {
        id: '1',
        name: 'Parking Lot 1',
        type: 'P',
        color: '#40E0D0',
        price: 3,
        zoneName: 'Downtown',
        sectorName: 'Commercial',
        streetName: 'Sheikh Zayed Road',
        totalSpots: 20,
        availableSpots: 5,
        latitude: 24.416058,
        longitude: 54.490618,
        distance: 0.5,
    },
    {
        id: '2',
        name: 'Parking Lot 2',
        type: 'SR',
        color: '#40E0D0',
        price: 2,
        zoneName: 'Residential',
        sectorName: 'Family',
        streetName: 'Al Wasl Road',
        totalSpots: 40,
        availableSpots: 13,
        latitude: 24.416001,
        longitude: 54.490488,
        distance: 1.2,
    },
    {
        id: '3',
        name: 'Parking Lot 3',
        type: 'S',
        color: '#40E0D0',
        price: 2,
        zoneName: 'Business',
        sectorName: 'Corporate',
        streetName: 'Sheikh Mohammed Bin Rashid Boulevard',
        totalSpots: 25,
        availableSpots: 7,
        latitude: 24.415949,
        longitude: 54.490358,
        distance: 0.8,
    },
    {
        id: '4',
        name: 'Parking Lot 4',
        type: 'P',
        color: '#40E0D0',
        price: 3,
        zoneName: 'Commercial',
        sectorName: 'Retail',
        streetName: 'street 4',
        totalSpots: 50,
        availableSpots: 20,
        latitude: 24.416763,
        longitude: 54.493786,
        distance: 1.0,
    },
    {
        id: '5',
        name: 'Parking Lot 5',
        type: 'S',
        color: '#40E0D0',
        price: 2,
        zoneName: 'Business',
        sectorName: 'Office',
        streetName: 'Al Saada Street',
        totalSpots: 40,
        availableSpots: 2,
        latitude: 25.2048,
        longitude: 55.2708,
        distance: 0.3,
    },
    {
        id: '6',
        name: 'Parking Lot 6',
        type: 'SR',
        color: '#40E0D0',
        price: 2,
        zoneName: 'Residential',
        sectorName: 'Apartment',
        streetName: 'Al Khaleej Street',
        totalSpots: 30,
        availableSpots: 8,
        latitude: 24.417813,
        longitude: 54.493519,
        distance: 0.9,
    },
    {
        id: '7',
        name: 'Parking Lot 7',
        type: 'P',
        color: '#40E0D0',
        price: 3,
        zoneName: 'Transport',
        sectorName: 'Metro',
        streetName: 'Al Rigga Street',
        totalSpots: 30,
        availableSpots: 5,
        latitude: 24.417391,
        longitude: 54.493284,
        distance: 0.7,


    },
    {
        id: '8',
        name: 'Parking Lot 8',
        type: 'S',
        color: '#40E0D0',
        price: 2,
        zoneName: 'Healthcare',
        sectorName: 'Medical',
        streetName: 'Al Maktoum Street',
        totalSpots: 30,
        availableSpots: 3,
        latitude: 24.413922,
        longitude: 54.492661,
        distance: 1.1,
    },
];

// Function to get nearest parking lots (mock implementation)
export const getNearestParkingLots = (userLocation: { latitude: number; longitude: number }, limit: number = 10): ParkingLot[] => {
    // In a real app, this would calculate actual distances
    // For mock purposes, we'll just return the first 'limit' parking lots
    return mockParkingLots.slice(0, limit);
};

// Function to filter parking lots by type
export const filterParkingLotsByType = (parkingLots: ParkingLot[], type: string): ParkingLot[] => {
    if (!type || type === 'all') {
        return parkingLots;
    }
    return parkingLots.filter(lot => lot.type === type);
}; 