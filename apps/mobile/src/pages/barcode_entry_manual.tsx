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
    FlatList,
} from 'react-native';
import { getProductByBarcode } from '@suppsense/api-client';
import { getProductResponse } from '@suppsense/shared-types';

export default function BarcodeEntryManual() {
    const [barcode, setBarcode] = useState('');
    const [product, setProduct] = useState<getProductResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canSubmit = barcode.trim() !== '' && !loading;

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

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <Text style={styles.title}>Manual Barcode Entry</Text>

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
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Look Up</Text>}
            </TouchableOpacity>

            {product && (
                <View style={styles.resultContainer}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productDescription}>{product.description}</Text>

                    <Text style={styles.sectionTitle}>Ingredients</Text>
                    <FlatList
                        data={product.ingredients}
                        keyExtractor={(item, idx) => `${item.name}-${idx}`}
                        renderItem={({ item }) => (
                            <View style={styles.ingredientRow}>
                                <Text style={styles.ingredientName}>{item.name}</Text>
                                {item.amount && <Text style={styles.ingredientAmount}>{item.amount}</Text>}
                            </View>
                        )}
                    />
                </View>
            )}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { 
        width: '100%', 
        alignItems: 'center', 
        padding: 20, 
        backgroundColor: '#0f0f0f' 
    },
    title: { 
        fontSize: 24, 
        fontWeight: 'bold', 
        marginBottom: 20, 
        color: '#fff' 
    },
    input: { 
        width: '100%', 
        height: 50, 
        borderColor: '#ccc', 
        borderWidth: 1, 
        borderRadius: 5, 
        paddingHorizontal: 10, 
        marginBottom: 15, 
        color: '#fff' 
    },
    button: { 
        width: '100%', 
        height: 50, 
        backgroundColor: '#0f62fe', 
        justifyContent: 'center', 
        alignItems: 'center', 
        borderRadius: 5 
    },
    buttonDisabled: { 
        backgroundColor: '#555' 
    },
    buttonText: { 
        color: '#fff', 
        fontSize: 16, 
        fontWeight: 'bold' 
    },
    error: { 
        color: 'red', 
        marginBottom: 15 
    },
    resultContainer: { 
        width: '100%', 
        marginTop: 20 
    },
    productName: { 
        fontSize: 20, 
        fontWeight: 'bold', 
        color: '#fff' 
    },
    productDescription: { 
        fontSize: 14, 
        color: '#ccc', 
        marginBottom: 15 
    },
    sectionTitle: { 
        fontSize: 16, 
        fontWeight: 'bold', 
        color: '#fff', 
        marginBottom: 8 
    },
    ingredientRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        paddingVertical: 6, 
        borderBottomColor: '#333', 
        borderBottomWidth: 1 
    },
    ingredientName: { 
        color: '#fff', 
        fontSize: 14 
    },
    ingredientAmount: { 
        color: '#aaa', 
        fontSize: 14 
    },
});