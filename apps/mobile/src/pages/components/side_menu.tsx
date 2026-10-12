import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DRAWER_WIDTH = Dimensions.get('window').width * 0.7; // covers 70% of the screen from left -> right

interface SideMenuItem {
    label: string;
    onPress: () => void;
}

interface SideDrawerProps {
    visible: boolean;
    onClose: () => void;
    items: SideMenuItem[];
}

/**
 * slide in side menu opened via hamburger icon in top bar
 * 
 * slides in from the left when opened and slides back out from the right when closed
 */
export default function SideMenu({ visible, onClose, items }: SideDrawerProps) {
    const insets = useSafeAreaInsets();
    const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current; // start off screen

    useEffect(() => {
        Animated.timing(translateX, {
            toValue: visible ? 0 : -DRAWER_WIDTH,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [visible]);

    if (!visible) {}

    return (
        // 'none' when hidden to prevent blocking other touch events
        // when open prevents the user from interacting with anything other than the side menu
        <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
            {/* touching outside of it closes it */}
            <TouchableOpacity
                style={styles.backdrop}
                activeOpacity={1}
                onPress={onClose}
            />

            <Animated.View
                style={[
                    styles.drawer,
                    { paddingTop: insets.top + 20, transform: [{ translateX }] },
                ]}
            >
                <Text style={styles.title}>SuppSense</Text>
                {items.map((item) => (
                    <TouchableOpacity
                        key={item.label}
                        style={styles.menuItem}
                        onPress={() => {
                            onClose();
                            item.onPress();
                        }}
                    >
                        <Text style={styles.menuItemLabel}>{item.label}</Text>
                    </TouchableOpacity>
                ))}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFill,
    },
    drawer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: -1,
        width: DRAWER_WIDTH,
        backgroundColor: '#1a1a1e',
        paddingHorizontal: 20,
        borderRightWidth: 1,
        borderRightColor: '#fff',
    },
    title: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },    
    menuItem: {
        paddingVertical: 14,
    },
    menuItemLabel: {
        color: '#fff',
        fontSize: 16,
    },
});