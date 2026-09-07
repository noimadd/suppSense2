import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DRAWER_WIDTH = Dimensions.get('window').width * 0.7;

interface SideDrawerProps {
    visible: boolean;
    onClose: () => void;
}

export default function SideMenu({ visible, onClose }: SideDrawerProps) {
    const insets = useSafeAreaInsets();
    const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

    useEffect(() => {
        Animated.timing(translateX, {
            toValue: visible ? 0 : -DRAWER_WIDTH,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [visible]);

    if (!visible) {}

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
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
                <Text style={styles.title}>Menu</Text>
                {/* TODO: add nav items */}
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
});