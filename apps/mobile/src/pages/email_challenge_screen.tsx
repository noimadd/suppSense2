import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { complete_email_verify_challenge, email_verify_challenge } from '@suppsense/api-client';

interface EmailChallengeScreenProps {
    onChallengeComplete : () => void;
    onChallengeExit : () => void;
    email: string;
    password: string;
}

/**
 * handles login when email and password is entered, if successful session is stored in keystore
 * @param param0 callback for successful login
 * @returns login page
 */
export default function EmailChallengeScreen(props : EmailChallengeScreenProps) {
    const [code, set_code] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Checker to ensure that the code string only ever contains numbers and is never longer than 6 chars.
    const SetCode = useCallback(
        (val: string) => {
            
            // User has made the string too long
            if(val.length > 6)
            {
                return;
            }
            
            // User added a non-number
            if(val.match(/^[0-9]+$/) == null && val !== '')
            {
                return;
            }
            
            set_code(val);
        },
        []
    );

    const canSubmitCode = useMemo(() => {
            return code.length === 6 && !loading;   
        },
        [code, loading]
    );
    
    if(props.email === null)
    {
        props.onChallengeExit();
    }

    const handleSubmitCode = async () => {
        console.log('Hello');
        if (!canSubmitCode) return;

        setLoading(true);
        
        const res = await complete_email_verify_challenge({email: props.email, code: code});
        
        if(res === null)
        {
            Toast.show({type: 'info', text1: 'An error occurred while verifying you email!', text2: 'Please try again later.'});
        }
        else if(res.success === true)
        {
            setLoading(false);            
            Toast.show({type: 'info', text1: 'Email Verified.', text2: 'Please login with your details.'});
            props.onChallengeComplete();
        }
        else
        {
            Toast.show({type: 'info', text1: 'An error occurred while verifying you email!', text2: 'Please try again later.'});
        }
        
        setLoading(false);
    };

    const handleResendCode = async () => {
        setLoading(true);
        const challenge_res = await email_verify_challenge({email: props.email, password: props.password});
    
        if(challenge_res === null)
        {
            Toast.show({type: 'info', text1: 'An error occurred while re-sending an email to you!'});            
        }
        else if(challenge_res.success)
        {
            Toast.show({type: 'info', text1: 'A new email has been sent.'});            
        }
        else
        {
            Toast.show({type: 'info', text1: 'An error occurred while re-sending an email to you!'});            
        }
        
        setLoading(false);
    };

    const handleCancelCode = async () => {
        props.onChallengeExit();
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* main heading */}
            <Text style={styles.title}>Verify Email</Text>
            <Text style={styles.subtitle}>
                An email has been sent to your address {props.email}. Copy the code here and click submit to verify that you own the email.
            </Text>
            
            {/* Code input */}
            <TextInput
                style={styles.input}
                placeholder="000000"
                placeholderTextColor="#888"
                value={code}
                maxLength={6}
                autoCapitalize="none"
                onChangeText={SetCode}
                keyboardType="numeric"
                editable={!loading}
            />

            {/* Submit button */}
            <TouchableOpacity
                style={[styles.button, !canSubmitCode && styles.buttonDisabled]}
                onPress={handleSubmitCode}
                disabled={!canSubmitCode}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Sign Up</Text>
                )}
            </TouchableOpacity>
            
            {/* Resend button */}
            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleResendCode}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Resend email</Text>
                )}
            </TouchableOpacity>
            
            {/* Cancel button */}
            <TouchableOpacity
                style={styles.button}
                onPress={handleCancelCode}
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
        marginTop: 3,
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