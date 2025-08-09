import React from 'react';
import { View, StyleSheet } from 'react-native';

interface UAEFlagIconProps {
    size?: number;
}

const UAEFlagIcon: React.FC<UAEFlagIconProps> = ({ size = 24 }) => {
    return (
        <View style={[styles.container, { width: size * 1.5, height: size }]}>
            {/* Red vertical stripe */}
            <View style={[styles.redStripe, { width: size * 0.5, height: size }]} />

            {/* Three horizontal stripes */}
            <View style={[styles.horizontalStripes, { width: size, height: size }]}>
                {/* Green stripe (top) */}
                <View style={[styles.greenStripe, { height: size / 3 }]} />

                {/* White stripe (middle) */}
                <View style={[styles.whiteStripe, { height: size / 3 }]} />

                {/* Black stripe (bottom) */}
                <View style={[styles.blackStripe, { height: size / 3 }]} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 2,
        overflow: 'hidden',
    },
    redStripe: {
        backgroundColor: '#FF0000',
    },
    horizontalStripes: {
        flexDirection: 'column',
    },
    greenStripe: {
        backgroundColor: '#00FF00',
    },
    whiteStripe: {
        backgroundColor: '#FFFFFF',
    },
    blackStripe: {
        backgroundColor: '#000000',
    },
});

export default UAEFlagIcon;
