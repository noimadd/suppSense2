import { useEffect, useState } from 'react';
import { 
    ScrollView,
    FlatList,
    Text,
    View,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity
} from 'react-native';

import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';

import Toast from 'react-native-toast-message'

import { StoredSession } from '../auth/auth';
import { ProductLibrary } from '@suppsense/shared-types';
import { get_user_library } from '@suppsense/api-client';

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
    
    const RenderProductRow = (row_props) =>
    {
        return(
            <TouchableOpacity style={styles.row_container} onPress={() => { props.onViewProduct(row_props.item.product_id) }}>
                <Text style={styles.product_title}>{row_props.item.name}</Text>
            </TouchableOpacity>
        );
    };

    // We werent given any data so we need to fetch it ourselves
    if(!props.libraryData)
    {
        useEffect(() => {
            FetchLibraryData();
        }, [props.session]);
    }
    
    if(loading)
    {
        return <ActivityIndicator color="#fff" />;
    }

    const rows = [];

    rows.push(
        <View style={styles.page_header}>
            <Text style={styles.page_title} key={'PageTitle'}>
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
            <View style={styles.row_container}>
                <Text style={styles.row_title} key={library.product_ids[i].id}>
                    { library.product_ids[i].name }
                </Text>
            </View>
        );
    }

    return(
        <SafeAreaProvider>
            <SafeAreaView style={styles.outer_div}>
                <ScrollView style={styles.outer_div}>
                    {
                        rows
                    }
                </ScrollView>
            </SafeAreaView>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    outer_div: {
        flex: 1,
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
        height: 70,
        width: '90%',
        backgroundColor: '#FF0000',
        borderRadius: 10,
        marginLeft: '5%',
        marginRight: '5%',
        marginBottom: 1,
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