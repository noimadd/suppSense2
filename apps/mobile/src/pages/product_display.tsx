import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getProductResponse } from '@suppsense/shared-types';

interface IngredientsScreenProps {
    product: getProductResponse;
    onBack: () => void;
}

export default function ProductDisplay({ product, onBack }: IngredientsScreenProps) {
    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
                <Text style={styles.backButtonText}>{'< Back'}</Text>
            </TouchableOpacity>

            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productDescription}>{product.description}</Text>

            <Text style={styles.sectionTitle}>Ingredients</Text>
            <View>
                {product.ingredients.map((item, idx) => (
                    <TouchableOpacity 
                        key={`${item.name}-${idx}`} 
                        style={styles.ingredientRow} 
                        onPress={() => {}}
                    >
                        <Text style={styles.ingredientName}>{item.name}</Text>
                        {item.amount && <Text style={styles.ingredientAmount}>{item.amount}</Text>}
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        padding: 20,
        backgroundColor: '#0f0f0f',
        flex: 1,
        justifyContent: 'center',
    },
    backButton: {
        marginBottom: 15,
    },
    backButtonText: {
        color: '#0f62fe',
        fontSize: 16,
        fontWeight: 'bold',
    },
    productName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    productDescription: {
        fontSize: 14,
        color: '#ccc',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    ingredientRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderBottomColor: '#333',
        borderBottomWidth: 1,
    },
    ingredientName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    ingredientAmount: {
        color: '#aaa',
        fontSize: 15,
    },
});