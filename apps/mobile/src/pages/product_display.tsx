import React from 'react';
import { useEffect, useState } from 'react';
import { Image } from 'react-native';
import { View, ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getProductResponse } from '@suppsense/shared-types';
import plus_sign_light from '../../assets/plus_sign_light.png';
import ModalAddToLibrary from './components/modal_add_to_library'

import { colors } from './components/colors'

interface IngredientsScreenProps {
    product: getProductResponse;
    onBack: () => void;
    onIngredientPress: (ingredientName: string) => void;
    onReloadLibraries: () => void;
    session: StoredSession;
}

/**
 * displays product name and image (to be added)
 * alongside a list of all the ingredients within the product
 */
export default function ProductDisplay({ product, onBack, onIngredientPress, onReloadLibraries, session }: IngredientsScreenProps)
{
    const [adding_product, setAddingProduct] = useState(false);

    if(adding_product)
    {
        return(<ModalAddToLibrary isVisible={adding_product} product={product} libraries={null}
                    onComplete={(should_reload_libraries: boolean) => { setAddingProduct(false); if(should_reload_libraries){ onReloadLibraries() }}}
                    session={session}
                />
               );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={{justifyContent: 'flex-start', paddingBottom: 10}}>
            {/* return to barcode entry screen */}
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
                <Text style={styles.backButtonText}>{'< Back'}</Text>
            </TouchableOpacity>            
            
            <View style={styles.page_header}>
                <View style={styles.productTitleContainer}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productDescription}>{product.description}</Text>
                </View>
                <TouchableOpacity style={styles.add_to_library_button} onPress={() => { setAddingProduct(true) }}>
                    <Image source={plus_sign_light} style={styles.plus_sign}/>
                </TouchableOpacity>
            </View>
            
            <Image source={{ uri: product.image_url }} style={styles.product_thumbnail}/>

            <Text style={styles.sectionTitle}>Ingredients</Text>
            <View style={{marginBottom: 20}}>
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
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        padding: 20,
        backgroundColor: colors.bg,
        flex: 1,
    },
    backButton: {
        marginBottom: 15,
    },
    backButtonText: {
        color: colors.back_button_txt,
        fontSize: 16,
        fontWeight: 'bold',
    },
    productTitleContainer: {
        maxWidth: '80%',
    },
    productName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.txt,
    },
    productDescription: {
        fontSize: 14,
        color: colors.txt,
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.txt,
        marginBottom: 8,
    },
    ingredientRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderBottomColor: colors.txt,
        borderBottomWidth: 1,
    },
    ingredientName: {
        color: colors.txt,
        fontSize: 16,
        fontWeight: '600',
    },
    ingredientAmount: {
        color: colors.txt,
        fontSize: 15,
    },
    page_header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%',
        marginBottom: 10,
    },
    add_to_library_button :
    {
        backgroundColor: colors.button_bg,
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
    product_thumbnail: {
        height: 300,
        width: 300,
        marginLeft: 'auto',
        marginRight: 'auto',
        borderRadius: 10,
        marginBottom: 10,
        resizeMode: 'contain',
    },
});