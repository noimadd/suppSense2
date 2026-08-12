import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { login } from '@suppsense/api-client';
import { decodeAccessToken } from '../auth/jwt_decoder';
import { storeSession } from '../auth/session_storage';

interface LoginScreenProps {
    onLoginSuccess: () => void;
}

/**
 * handles login when email and password is entered, if successful session is stored in keystore
 * @param param0 callback for successful login
 * @returns login page
 */
export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canSubmit = email.trim() !== '' && password.trim() !== '' && !loading;

    const handleLogin = async () => {
        if (!canSubmit) return;

        setError(null);
        setLoading(true);

        try {
            const { accessToken, refreshToken, sessionId } = await login({
                email: email.trim().toLowerCase(),
                password,
            });

            const payload = decodeAccessToken(accessToken);
            if (!payload?.sub) { throw new Error('Error decoding access token'); }

            await storeSession({
                accessToken,
                refreshToken,
                sessionId,
                userId: payload.sub,
            });

            onLoginSuccess();
        } catch (err) {
            console.error('Login error:', err);
            setError('Invalid email or password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* main heading */}
            <Text style={styles.title}>Login Screen</Text>

            {/* email input */}
            <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#888"
                value={email}
                autoCapitalize="none"
                onChangeText={setEmail}
                keyboardType="email-address"
                editable={!loading}
            />

            {/* password input */}
            <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#888"
                value={password}
                autoCapitalize="none"
                secureTextEntry
                onChangeText={setPassword}
                editable={!loading}
            />

            {/* error message */}
            {error && <Text style={styles.error}>{error}</Text>}

            {/* login button */}
            <TouchableOpacity
                style={[styles.button, !canSubmit && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={!canSubmit}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Log In</Text>
                )}
            </TouchableOpacity>
        </KeyboardAvoidingView>
    );
}

// random auto complete from copilot... probably looks like shit - can do proper design later works for now
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#0f0f0f',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#fff',
    },
    input: {
        width: '100%',
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 15,
        color: '#fff',
    },
    button: {
        width: '100%',
        height: 50,
        backgroundColor: '#007bff',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 5,
    },
    buttonDisabled: {
        backgroundColor: '#555',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    error: {
        color: 'red',
        marginBottom: 15,
    },
});