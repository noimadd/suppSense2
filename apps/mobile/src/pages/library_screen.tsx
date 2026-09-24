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
import { ProductLibrary } from '@suppsense/shared-types';
import { get_user_library, getProductById } from '@suppsense/api-client';

interface LibraryProps
{
    onExit: () => void;
    onViewProduct: (string) => void;
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

    // We werent given any data so we need to fetch it ourselves
    if(!props.libraryData)
    {
        useEffect(() => {
            FetchLibraryData();
        }, [props.session]);
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
            <TouchableOpacity style={styles.add_product_button} onPress={() => { props.onAddProduct(library.id) }}>
                <Text style={styles.add_product_button_label}>
                    {'+'}
                </Text>        
            </TouchableOpacity>
        </View>
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
        marginBottom: 1,
        flexDirection: 'row',
    },
    product_thumbnail: {
        height: 130,
        width: 130,
    },
    product_title: {
        color: '#FFFFFF',
        fontSize: 18,
        backgroundColor: 'transparent',
        marginTop: 'auto',
        marginBottom: 1,
    },
    page_title: {
        color: '#FFFFFF',
        fontSize: 30,
        backgroundColor: 'transparent'
    },
    add_product_button :
    {
        backgroundColor: '#0000FF',
        borderRadius: 15,
        width: 35,
        height: 35,
        justifyContent: 'center',
        alignItems: 'center',
    },
    add_product_button_label :
    {
        flex: 1,
        textAlign: 'center',
        color: '#FFFFFF',
        fontSize: 30,
    },
    page_header :
    {
        flexDirection: 'row',
    },
})