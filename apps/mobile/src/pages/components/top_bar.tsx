import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TopBarProps {
    onMenuPress: () => void;
    onProfilePress: () => void;
}

export default function TopBar({ onMenuPress, onProfilePress }: TopBarProps) {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity style={styles.burgerIcon} onPress={onMenuPress} hitSlop={10}>
                <View style={styles.burgerBar} />
                <View style={styles.burgerBar} />
                <View style={styles.burgerBar} />
            </TouchableOpacity>

            <TouchableOpacity onPress={onProfilePress} hitSlop={10}>
                <View style={styles.profileCircle} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 12,
        backgroundColor: 'grey',
    },
    burgerIcon: {
        justifyContent: 'center',
        gap: 4,
    },
    burgerBar: {
        width: 24,
        height: 2,
        backgroundColor: '#fff',
        borderRadius: 1,
    },
    profileCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'blue',
    },
});