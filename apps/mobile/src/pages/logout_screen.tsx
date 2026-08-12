import React, { useState } from 'react';
import { 
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator
} from 'react-native';

import { handleLogout } from '../auth/logout';

interface LogoutButtonProps {
    onLoggedOut: () => void;
}

export default function LogoutScreen({ onLoggedOut }: LogoutButtonProps) {
    const [ isLoggingOut, setIsLoggingOut ] = useState(false);

    const logout = async () => {
        if (isLoggingOut) return;

        setIsLoggingOut(true);

        try {
            await handleLogout();
            onLoggedOut();
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <TouchableOpacity style={styles.button} onPress={logout} disabled={isLoggingOut}>
            <Text style={styles.text}>Log out</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ee4a4a',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        color: '#000',
        fontSize: 15,
        fontWeight: '600'
    },
})