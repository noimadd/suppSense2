import React from 'react';
import { useEffect, useState } from 'react';
import { Image } from 'react-native';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getProductResponse } from '@suppsense/shared-types';
import plus_sign_light from '../../assets/plus_sign_light.png';
import ModalAddToLibrary from './components/modal_add_to_library'

interface IngredientsScreenProps {
    product: getProductResponse;
    onBack: () => void;
    onIngredientPress: (ingredientName: string) => void;
    session: StoredSession;
}

/**
 * displays product name and image (to be added)
 * alongside a list of all the ingredients within the product
 */
export default function ProductDisplay({ product, onBack, onIngredientPress, session }: IngredientsScreenProps)
{
    const [adding_product, setAddingProduct] = useState(false);

    if(adding_product)
    {
        return (<ModalAddToLibrary isVisible={adding_product} product={product} libraries={null}
                    onComplete={() => { setAddingProduct(false) }} session={session}/>);
    }

    return (
        <View style={styles.container}>
            {/* return to barcode entry screen */}
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
                <Text style={styles.backButtonText}>{'< Back'}</Text>
            </TouchableOpacity>
            
            <View style={styles.page_header}>
                <View>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productDescription}>{product.description}</Text>
                </View>
                <TouchableOpacity style={styles.add_to_library_button} onPress={() => { setAddingProduct(true) }}>
                    <Image source={plus_sign_light} style={styles.plus_sign}/>
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Ingredients</Text>
            <View>
                {product.ingredients.map((item, idx) => (
                    <TouchableOpacity 
                        key={`${item.name}-${idx}`} 
                        style={styles.ingredientRow} 
                        onPress={() => onIngredientPress(item.name)}
                    >
                        <Text style={styles.ingredientName}>{item.name}</Text>
                        {item.amount && <Text style={styles.ingredientAmount}>{item.amount.toFixed(2) + item.unit}</Text>}
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
    page_header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%',
        marginBottom: 10,
        color: '#FF0000',
    },
    add_to_library_button :
    {
        backgroundColor: '#0000FF',
        borderRadius: 10,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 'auto',
    },
    plus_sign: {
        height: 30,
        width: 30,
    },
});