import { useEffect, useState } from 'react';
import { 
    ScrollView,
    FlatList,
    Text,
    View,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Image
} from 'react-native';

import {useSafeAreaInsets, SafeAreaProvider} from 'react-native-safe-area-context';

import Toast from 'react-native-toast-message'

import { StoredSession } from '../auth/auth';
import { ProductLibrary, IngredientEntry } from '@suppsense/shared-types';
import { get_user_library, get_product_library_summary, getProductById } from '@suppsense/api-client';
import plus_sign_light from '../../assets/plus_sign_light.png';

interface LibraryProps
{
    onExit: () => void;
    onViewProduct: (string) => void;
    onIngredientPress: (string) => void;
    onAddProduct: (string) => void;
    session: StoredSession;
    
    // Note(Leo): You can choose to pass the entire library data set if the caller already has the data, this avoids doing a query to the DB.
    //            Otherwise you must pass libraryId so that we can query the library data.
    libraryData: ProductLibrary;
    libraryId: string;
}

export default function LibraryScreen(props: LibraryProps)
{
    const [loading, setLoading] = useState(props.libraryData ? false : true);
    const [library, setLibrary] = useState(props.libraryData ? props.libraryData : {});
    const [library_ingredients, setLibraryIngredients] = useState<IngredientEntry | null>(null);

    const FetchLibraryData = async () =>
    {
        const res = await get_user_library(props.session.accessToken, props.libraryId);
        
        if(res === null || res.success !== true)
        {
            Toast.show({type: 'info', text1: 'An error occurred while fetching your library!', text2: 'Please try again later.'});
        }
        // Success, show our library
        else
        {
            setLibrary(res.result);
        }
        
        setLoading(false);
    };

    const FetchLibraryIngredients = async () => {
        const lib_id = props.libraryId ? props.libraryId : props.libraryData.id;
        const res = await get_product_library_summary(props.session.accessToken, lib_id);
        
        if(res === null || res.success !== true)
        {
            Toast.show({type: 'info', text1: 'An error occurred while fetching library details!', text2: 'Please try again later.'});
        }
        else
        {
            setLibraryIngredients(res.result);
        }
    };

    // We werent given any data so we need to fetch it ourselves
    if(!props.libraryData)
    {
        useEffect(() => {
            FetchLibraryData();
        }, [props.session]);
    }
    
    if(!library_ingredients)
    {
        FetchLibraryIngredients();
    }
    
    const insets = useSafeAreaInsets();
    
    if(loading)
    {
        return <ActivityIndicator color="#fff" />;
    }

    const rows = [];

    rows.push(
        <TouchableOpacity style={styles.backButton} onPress={props.onExit} key={'BackButton'}>
                <Text style={styles.backButtonText}>{'< Back'}</Text>
        </TouchableOpacity>
    );

    rows.push(
        <View style={styles.page_header} key={'PageTitle'}>
            <Text style={styles.page_title}>
                { library.library_name }
            </Text>
        </View>
    );
    
    rows.push(
        <Text style={styles.section_title}>
            {"Ingredient Summary"}
        </Text>
    );
    
    if(library_ingredients)
    {
        for(let i = 0; i < library_ingredients.length; i++)
        {
            const ingredient = library_ingredients[i];
            
            rows.push(
                <TouchableOpacity style={styles.ingredient_row}
                    key={ingredient.name}
                    onPress={() => { props.onIngredientPress(ingredient.name) }}
                >
                    <Text style={styles.ingredient_name}>{ingredient.name}</Text>
                    {ingredient.amount &&
                        <Text style={styles.ingredient_amount}>
                            {ingredient.amount.toFixed(2) + ingredient.unit}
                        </Text>
                    }
                </TouchableOpacity>
            );
        }
    }

    rows.push(
        <Text style={styles.section_title}>
            {"Products"}
        </Text>
    );
    
    rows.push(
        <TouchableOpacity style={styles.add_product_button} onPress={() => { props.onAddProduct(library.id) }}>
            <Image source={plus_sign_light} style={styles.plus_sign}/>
        </TouchableOpacity>
    );
    
    for(let i = 0; i < library.product_ids.length; i++)
    {
        rows.push(
            <TouchableOpacity style={styles.row_container}
                key={library.product_ids[i].product_id}
                onPress={() => { props.onViewProduct(library.product_ids[i].product_id) }}
            >
                <Image source={{ uri: library.product_ids[i].image_url }} style={styles.product_thumbnail}/>
                <Text style={styles.row_title}>
                    { library.product_ids[i].name }
                </Text>
            </TouchableOpacity>
        );
    }

    return(
        <SafeAreaProvider style={[styles.outer_div, { paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right }]}>
            <ScrollView>
                {
                    rows
                }
            </ScrollView>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    backButtonText: {
        color: '#0f62fe',
        fontSize: 16,
        fontWeight: 'bold',
    },
    backButton: {
        marginRight: 10,
    },
    outer_div: {
        width: '100%',
        height: '100%',
        backgroundColor: '#0f0f12',
    },
    text: {
        color: '#000',
        fontSize: 15,
        fontWeight: '600'
    },
    row_title: {
        color: '#FFFFFF',
        fontSize: 18,
        backgroundColor: 'transparent',
        marginBottom: 1,
        marginTop: 1,
    },
    row_container: {
        height: 130,
        width: '90%',
        backgroundColor: '#606060',
        borderRadius: 10,
        marginLeft: '5%',
        marginRight: '5%',
        marginBottom: 10,
        flexDirection: 'row',
    },
    ingredient_row: {
        marginLeft: 20,
        marginRight: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderBottomColor: '#333',
        borderBottomWidth: 1,
    },
    ingredient_name: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    ingredient_amount: {
        color: '#aaa',
        fontSize: 15,
    },
    product_thumbnail: {
        height: 130,
        width: 130,
        borderRadius: 10,
        marginRight: 10,
    },
    page_title: {
        color: '#FFFFFF',
        fontSize: 30,
        backgroundColor: 'transparent',
    },
    section_title: {
        color: '#FFFFFF',
        fontSize: 18,
        backgroundColor: 'transparent',
        marginTop: 10,
    },
    add_product_button :
    {
        backgroundColor: '#0000FF',
        borderRadius: 10,
        width: '90%',
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: '5%',
        marginRight: '5%',
        marginTop: 10,
        marginBottom: 10,
    },
    plus_sign: {
        height: 30,
        width: 30,
    },
    page_header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%',
    },
})