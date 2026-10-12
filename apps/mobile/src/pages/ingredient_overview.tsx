import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, Linking, StyleSheet } from 'react-native';
import { getIngredientByName } from '@suppsense/api-client';
import { getIngredientResponse } from '@suppsense/shared-types';

interface IngredientOverviewProps {
    ingredientName: string;
    onBack: () => void;
}

/**
 * gets ingredient information from API based on name
 * 
 * displays all of the ingredient related information in the order
 * Image
 * Name - badge
 * rec dosage - amount
 * max dosage - amount
 * AI overview
 * link to research paper
 */
export default function IngredientOverview({ ingredientName, onBack }: IngredientOverviewProps) {
    const [ingredient, setIngredient] = useState<getIngredientResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        setLoading(true);
        setError(null);

        // gets ingredient name from API
        getIngredientByName(ingredientName)
            .then((result) => { if (!cancelled) setIngredient(result); })
            .catch((err: any) => {
                if (cancelled) return;
                console.error('Ingredient lookup error: ', err);
                setError(err?.status === 404 ? 'Ingredient not found.' : 'Something went wrong loading this ingredient.');
            })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [ingredientName]);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
                <Text style={styles.backButtonText}>{'< Back'}</Text>
            </TouchableOpacity>

            {loading && <ActivityIndicator color="#0f62fe" />}

            {error && <Text style={styles.error}>{error}</Text>}

            {ingredient && (
                <>
                    {ingredient.image_url && (
                        <Image source={{ uri: ingredient.image_url }} style={styles.image} />
                    )}

                    <View style={styles.titleRow}>
                        <Text style={styles.name}>{ingredient.name}</Text>
                        {ingredient.verified ? (
                            <Text style={[styles.verifiedBadge, styles.badge]}>Verified</Text>
                        ) : (
                            <Text style={[styles.notVerifiedBadge, styles.badge]}>Not-Verified</Text>
                        )}
                    </View>

                    <View>
                        <View style={styles.dosageRow}>
                            <Text style={styles.dosageLabel}>Recommended Dosage</Text>
                            <Text style={styles.dosageValue}>{ingredient.recommended_dosage}</Text>
                        </View>
                        <View style={styles.dosageRow}>
                            <Text style={styles.dosageLabel}>Maximum Dosage</Text>
                            <Text style={styles.dosageValue}>{ingredient.maximum_dosage}</Text>
                        </View>
                    </View>

                    <Text style={styles.description}>{ingredient.description}</Text>

                    {ingredient.paper_url && (
                        <TouchableOpacity
                            style={styles.paperButton}
                            onPress={() => Linking.openURL(ingredient.paper_url)}
                        >
                            <Text style={styles.paperButtonText}>View Scientific Research</Text>
                        </TouchableOpacity>
                    )}
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f0f0f',
    },
    content: {
        padding: 20,
    },
    backButton: {
        marginBottom: 15,
    },
    backButtonText: {
        color: '#0f62fe',
        fontSize: 16,
        fontWeight: 'bold',
    },
    error: {
        color: 'red',
        marginTop: 20,
    },
    image: {
        width: '100%',
        height: 180,
        borderRadius: 8,
        marginBottom: 15,
        backgroundColor: '#1a1a1e',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
    },
    badge: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#0f0f12',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
        overflow: 'hidden',
    },
    verifiedBadge: {
        backgroundColor: '#4ade80',
    },
    notVerifiedBadge: {
        backgroundColor: '#fa1420'
    },
    description: {
        fontSize: 15,
        color: '#ccc',
        marginBottom: 20,
        lineHeight: 21,
        marginTop: 15,
    },
    dosageRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomColor: '#333',
        borderBottomWidth: 1,
    },
    dosageLabel: {
        color: '#aaa',
        fontSize: 14,
    },
    dosageValue: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    paperButton: {
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#0f62fe',
    },
    paperButtonText: {
        color: '#0f62fe',
        fontSize: 15,
        fontWeight: 'bold',
    },
});