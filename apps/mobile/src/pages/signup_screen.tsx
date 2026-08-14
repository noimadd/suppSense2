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

interface SignupScreenProps {
    onSignupFailure: () => void;
    onSignupSuccess: () => void;
}

/**
 * handles login when email and password is entered, if successful session is stored in keystore
 * @param param0 callback for successful login
 * @returns login page
 */
export default function SignupScreen({ onSignupFailure, onSignupSuccess }: SignupScreenProps) {
    const [email, SetEmail] = useState('');
    const [password, SetPassword] = useState('');
    const [first_name, SetFirstName] = useState('');
    const [last_name, SetLastName] = useState('');
    const [user_name, SetUserName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canSubmitSignup = email.trim() !== '' && password.trim() !== '' && first_name.trim() !== '' && last_name.trim() !== '' && user_name.trim() !== ''
                        && !loading;

    const handleSignup = async () => {
        if (!canSubmitSignup) return;

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

    handleSignup = async () => {
        setError(null))
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* main heading */}
            <Text style={styles.title}>Login</Text>

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
            
            {/* Signup heading  */}
            <Text style={styles.subtitle}>or sign up if you dont already have an account!</Text>

            <TouchableOpacity
                style={styles.button}
                onPress={handleLogin}
                disabled={!canSubmit}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Sign Up</Text>
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
    subtitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 2,
        marginBottom: 2,
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
        backgroundColor: '#0f62fe',
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