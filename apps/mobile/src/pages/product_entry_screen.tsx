import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';

import { IngredientEntry, createProductRequest } from '@suppsense/shared-types';
import { createUserSubmittedProduct } from '@suppsense/api-client';
import ModalPickIngredient from './components/modal_pick_ingredient';

import { colors } from './components/colors';

interface ProductEntryProps
{
    session: StoredSession;
    barcode: string;
    onExit: () => void;
    onComplete: (product_id: string) => void;
}

enum ProductEntryState
{
    BEFORE,
    ENTRY_SCREEN,
    INGREDIENT_SELECTION
}

export default function ProductEntryScreen(props: ProductEntryProps)
{
    const [product_name, setProductName] = useState('');
    const [image_url, setImageUrl] = useState('');
    const [barcode, setBarcode] = useState(props.barcode);
    const [brand, setBrand] = useState('');
    const [description, setDescription] = useState('');
    const [ingredients, setIngredients] = useState<IngredientEntry[]>([]);
    const [entry_state, setEntryState] = useState(ProductEntryState.BEFORE);

    const canSubmit = product_name.trim().length > 5 && barcode.trim().length > 0 && ingredients.length > 0 && image_url.trim().length > 0
                        brand.trim().length > 5 && description.trim().length > 5;

    const handleSubmit = async () => {
        if (!canSubmit) return;        
        
        // Form our request object
        const product_request = {
            "barcode": barcode,
            "name": product_name,
            "brand": brand,
            "description": description,
            "ingredients": ingredients,
            "image_url": image_url,
        };
        
        const result = await createUserSubmittedProduct(props.session.accessToken, product_request);
        
        if(result === null || result.success !== true)
        {
            Toast.show({type: 'info', text1: 'An error occurred while creating your product!', text2: 'Please try again later.'});
        }
        else
        {
            props.onComplete();
        }
        
    };

    const handleExit = async () => {
        props.onExit();
    };
    
    const insertIngredient = (ingredient) => {
        const exists = ingredients.some(i => i.id === ingredient.id);
        
        if(!exists)
        {
            setIngredients([...ingredients, ingredient]);
        }
    };
    
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
    
    if(entry_state === ProductEntryState.INGREDIENT_SELECTION)
    {
        return(
            <ModalPickIngredient isVisible={true} onCancel={() => { setEntryState(ProductEntryState.ENTRY_SCREEN) }}
                onComplete={(chosen: IngredientEntry) => { setEntryState(ProductEntryState.ENTRY_SCREEN); insertIngredient(chosen) }} session={props.session}/>
        );
    }

    const RenderIngredientListRow = (row_props) => {
        return(
            <View style={styles.ingredient_list_row}>
                <Text style={styles.ingredient_list_text}>
                    {row_props.item.name}
                </Text>
                <Text style={styles.ingredient_list_amount}>
                    {row_props.item.amount.toFixed(2) + row_props.item.unit}
                </Text>
            </View>
        );
    };
    
    const RenderIngredientHeaderRow = (row_props) => {
        return(
            <TouchableOpacity style={styles.ingredient_header_row}
                onPress={() => { setEntryState(ProductEntryState.INGREDIENT_SELECTION) }}
            >
                <Text style={styles.ingredient_header_text}>
                    {'Add Ingredient'}
                </Text>
            </TouchableOpacity>
        );
    };
    
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
                placeholder="Product Brand"
                placeholderTextColor="#888"
                value={brand}
                autoCapitalize="none"
                onChangeText={setBrand}
                keyboardType="default"
            />

            <TextInput
              style={styles.description_input}
              value={description}
              onChangeText={setDescription}
              multiline={true}
              placeholder="Description"
            />
            
            <TextInput
                style={styles.input}
                placeholder="Barcode"
                placeholderTextColor="#888"
                value={barcode}
                autoCapitalize="none"
                onChangeText={setBarcode}
                keyboardType="number-pad"
            />
            
            <TextInput
                style={styles.input}
                placeholder="Thumbnail URL"
                placeholderTextColor="#888"
                value={image_url}
                autoCapitalize="none"
                onChangeText={setImageUrl}
                keyboardType="default"
            />
            
            <FlatList
                style={styles.ingredient_list}
                data={ingredients}
                keyExtractor={item => item.name}
                renderItem={RenderIngredientListRow}
                ListHeaderComponent={() => { return RenderIngredientHeaderRow() }}
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
        backgroundColor: colors.bg,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: colors.txt,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 2,
        marginBottom: 2,
        color: colors.txt,
    },
    input: {
        width: '100%',
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 15,
        color: colors.txt,
    },
    description_input: {
        width: '100%',
        height: 'auto',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 15,
        color: colors.txt,
        numberOfLines: 10,
    },
    button: {
        width: '100%',
        height: 50,
        backgroundColor: colors.button_bg,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 5,
        marginTop: 1,
    },
    buttonDisabled: {
        backgroundColor: colors.disabled_button_bg,
    },
    buttonText: {
        color: colors.button_txt,
        fontSize: 16,
        fontWeight: 'bold',
    },
    error: {
        color: colors.error_txt,
        marginBottom: 15,
    },
    ingredient_list: {
        flex: 1,
        width: '90%',
        paddingLeft: 'auto',
        paddingRight: 'auto',
    },
    ingredient_list_row: {
        height: 50,
        width: '100%',
        backgroundColor: colors.disabled_button_bg,
        padding: 10,
        borderRadius: 10,
        marginBottom: 5,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    ingredient_header_row: {
        height: 50,
        width: '100%',
        padding: 10,
        borderRadius: 10,
        marginBottom: 5,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        backgroundColor: colors.button_bg,
    },
    ingredient_list_text: {
        color: colors.button_txt,
        fontSize: 16,
        fontWeight: 'bold',
    },
    ingredient_list_amount: {
        marginLeft: 'auto',
        color: colors.button_txt,
        fontSize: 13,
        fontWeight: 'bold',
    },
    ingredient_header_text: {
        color: colors.button_txt,
        fontSize: 16,
        fontWeight: 'bold',
    },
    description_text: {
        color: colors.txt,
        fontSize: 16,
        fontWeight: 'bold',
    },
});