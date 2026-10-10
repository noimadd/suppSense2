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
import { IngredientEntry } from '@suppsense/shared-types'

interface ProductEntryProps
{
    onExit: () => void;
    onComplete: () => void;
}

enum ProductEntryState
{
    BEFORE,
    ENTRY_SCREEN
}

export default function ProductEntryScreen(props: ProductEntryProps)
{
    const [product_name, setProductName] = useState('');
    const [barcode, setBarcode] = useState('');
    const [ingredients, setIngredients] = useState<IngredientEntry>([]);
    const [entry_state, setEntryState] = useState(ProductEntryState.BEFORE);

    const canSubmit = product_name.trim() !== '' && barcode.trim() !== '' && ingredients.trim() !== '' && !loading;

    const handleSubmit = async () => {
        if (!canSubmit) return;        
        
    };

    const handleExit = async () => {
        props.onExit();
    }
    
    // Allow the user to cancel out if they dont feel like entering the product details
    if(entry_state === ProductEntryState.BEFORE)
    {
        return(
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <Text style={styles.subtitle}>
                    {'The product you searched for was not found. Would you like to manually enter it?'}
                </Text>
            
                <TouchableOpacity style={styles.button} onPress={() => { setEntryState(ProductEntryState.ENTRY_SCREEN) }}>
                    <Text style={styles.buttonText}>Continue</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.button} onPress={handleExit}>
                    <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        );
    }
    
    return(
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <Text style={styles.title}>Product Entry</Text>
        
            <TextInput
                style={styles.input}
                placeholder="Product Name"
                placeholderTextColor="#888"
                value={product_name}
                autoCapitalize="none"
                onChangeText={setProductName}
                keyboardType="default"
            />
            
            <TextInput
                style={styles.input}
                placeholder="Barcode"
                placeholderTextColor="#888"
                value={barcode}
                autoCapitalize="none"
                onChangeText={setBarcode}
                keyboardType="default"
            />
            
            <TouchableOpacity
                style={[styles.button, !canSubmit && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={!canSubmit}
            >    
                <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
                style={styles.button}
                onPress={handleExit}
            >
                <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        padding: 10,
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