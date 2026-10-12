import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TopBarProps {
    onMenuPress: () => void;
    onProfilePress: () => void;
}

/**
 * displays a bar along the top of the screen contains 
 * a burger menu icon on the left - opens the side menu
 * a profile icon on the right - functionality to be added in future
 * 
 * @param onMenuPress - Called when the burger menu icon is pressed
 * @param onProfilePress - Called when the profile icon is press
 */
export default function TopBar({ onMenuPress, onProfilePress }: TopBarProps) {
    const insets = useSafeAreaInsets(); // places bar below status bar

    return (
        <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
            {/* burger menu button */}
            <TouchableOpacity style={styles.burgerIcon} onPress={onMenuPress} hitSlop={10}>
                <View style={styles.burgerBar} />
                <View style={styles.burgerBar} />
                <View style={styles.burgerBar} />
            </TouchableOpacity>

            {/* profile button - blue circular placeholder for now to be updated to the users pfp */}
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