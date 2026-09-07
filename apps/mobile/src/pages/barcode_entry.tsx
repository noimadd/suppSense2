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
import { getProductByBarcode } from '@suppsense/api-client';
import { getProductResponse } from '@suppsense/shared-types';


import ProductDisplay from './product_display';

/**
 * allows the user to enter in a barcode manually (camera scanning to be added later) 
 * this transports them to the ingredients_display page 
 * passes along product data return from api to this page
 */
export default function BarcodeEntryScreen() {
    const [barcode, setBarcode] = useState('');
    const [product, setProduct] = useState<getProductResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // only submit on containing data
    const canSubmit = barcode.trim() !== '' && !loading;

    // looks up barcode via API and stores result
    const handleLookup = async () => {
        if (!canSubmit) return;

        setError(null);
        setProduct(null);
        setLoading(true);

        try {
            const result = await getProductByBarcode(barcode.trim());
            setProduct(result);
        } catch (err: any) {
            console.error('Barcode lookup error:', err);
            setError(err?.status === 404 ? 'No product found for that barcode.' : 'Something went wrong looking that up.');
        } finally {
            setLoading(false);
        }
    };

    // TODO: connect this with a barcode scanning and camera library
    const handleScanBarcode = () => {};

    if (product) {
        return <ProductDisplay product={product} onBack={() => setProduct(null)} />;
    }

    // visual components consisting of 
    // button for camera (not operational)
    // text enter area for manual barcode entry
    // enter button for the manual barcode entry
    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <Text style={styles.title}>Barcode Entry</Text>

            <TouchableOpacity style={styles.button} onPress={handleScanBarcode}>
                <Text style={styles.buttonText}>Scan Barcode</Text>
            </TouchableOpacity>

            <Text style={styles.orText}>or enter manually</Text>

            <TextInput
                style={styles.input}
                placeholder="Barcode"
                placeholderTextColor="#888"
                value={barcode}
                autoCapitalize="none"
                keyboardType="number-pad"
                onChangeText={setBarcode}
                editable={!loading}
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity
                style={[styles.button, !canSubmit && styles.buttonDisabled]}
                onPress={handleLookup}
                disabled={!canSubmit}
            >
                {/* shows a spinner when loading */}
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Look Up</Text>}
            </TouchableOpacity>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
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
    orText: {
        color: '#888',
        fontSize: 14,
        marginVertical: 10,
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