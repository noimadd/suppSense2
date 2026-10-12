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
import Toast from 'react-native-toast-message'

import { signup, email_verify_challenge } from '@suppsense/api-client';
import EmailChallengeScreen from './email_challenge_screen';

interface SignupScreenProps
{
    onSignupExit: () => void;
    onSignupSuccess: () => void;
}

/**
 * handles login when email and password is entered, if successful session is stored in keystore
 * @param param0 callback for successful login
 * @returns login page
 */
enum SignupState {
    REGISTER = 'REGISTER',
    VERIFY = 'VERIFY',
}

export default function SignupScreen({ onSignupExit, onSignupSuccess }: SignupScreenProps) {
    const [signupState, setSignupState] = useState<SignupState>(SignupState.REGISTER);
    
    const [email, SetEmail] = useState('');
    const [password, SetPassword] = useState('');
    const [first_name, SetFirstName] = useState('');
    const [last_name, SetLastName] = useState('');
    const [user_name, SetUserName] = useState('');
    const [loading, setLoading] = useState(false);

    const canSubmitSignup = email.trim() !== '' && password.trim() !== '' && first_name.trim() !== '' && last_name.trim() !== '' && user_name.trim() !== ''
                        && !loading;

    const handleSignup = async () => {
        if (!canSubmitSignup) return;

        setLoading(true);

        const res = await signup({ f_name: first_name, l_name: last_name, email: email, u_name: user_name, password: password });

        if(res === null)
        {
            Toast.show({type: 'info', text1: 'An error occurred while signing you up!', text2: 'Please try again later.'});      
        }
        // Success! Now send an email challenge to the user's email
        else if(res.success === true)
        {
            const challenge_res = await email_verify_challenge({email: email, password: password});
            setLoading(false);
            setSignupState(SignupState.VERIFY);
        }
        // User email is already registered so move them over to the login screen and show a message
        else if(res.status == 401)
        {
            Toast.show({type: 'info', text1: 'Your account is already registered!', text2: 'Log in to verify your email.'});
            setLoading(false);
            onSignupExit();
        }
        else
        {
            Toast.show({type: 'info', text1: 'An error occurred while signing you up!', text2: 'Please try again later.'});
        }

        setLoading(false);
    };

    const handleExit = async () => {
        setLoading(false);
        onSignupExit();
    }
    
    if(signupState === 'VERIFY')
    {
        return(<EmailChallengeScreen email={email} password={password} onChallengeComplete={() => onSignupSuccess() } onChallengeExit={() => setSignupState(SignupState.REGISTER) } />);
    }
    
    return(
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* main heading */}
            <Text style={styles.title}>Signup</Text>
            
            {/* Firstname input */}
            <TextInput
                style={styles.input}
                placeholder="First Name"
                placeholderTextColor="#888"
                value={first_name}
                autoCapitalize="none"
                onChangeText={SetFirstName}
                keyboardType="default"
                editable={!loading}
            />
            
            {/* Lastname input */}
            <TextInput
                style={styles.input}
                placeholder="Last Name"
                placeholderTextColor="#888"
                value={last_name}
                autoCapitalize="none"
                onChangeText={SetLastName}
                keyboardType="default"
                editable={!loading}
            />
            
            {/* Username input */}
            <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#888"
                value={user_name}
                autoCapitalize="none"
                onChangeText={SetUserName}
                keyboardType="default"
                editable={!loading}
            />

            {/* email input */}
            <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#888"
                value={email}
                autoCapitalize="none"
                onChangeText={SetEmail}
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
                onChangeText={SetPassword}
                editable={!loading}
            />

            {/* Submit button */}
            <TouchableOpacity
                style={[styles.button, !canSubmitSignup && styles.buttonDisabled]}
                onPress={handleSignup}
                disabled={!canSubmitSignup}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Sign Up</Text>
                )}
            </TouchableOpacity>
            
            {/* Cancel button */}
            <TouchableOpacity
                style={styles.button}
                onPress={handleExit}
            >
                <Text style={styles.buttonText}>Cancel</Text>
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
        marginTop: 1,
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