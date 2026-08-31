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

import { get_user_libraries } from '@suppsense/api-client';
import { ProductLibrary } from '@suppsense/shared-types';
import { StoredSession } from '../auth/auth';

interface LibrariesProps
{
    onExit: () => void;
    onViewLibrary: (ProductLibrary) => void;
    onViewProduct: (string) => void;
    onAddProduct: (string) => void;
    session: StoredSession;
}

export default function LibrariesScreen(props: LibrariesProps)
{
    const [loading, setLoading] = useState(true);
    const [libraries, setLibraries] = useState([]);

    const FetchUserLibraries = async () =>
    {
        const res = await get_user_libraries(props.session.accessToken);
        
        if(res === null || res.success !== true)
        {
            Toast.show({type: 'info', text1: 'An error occurred while fetching your libraries!', text2: 'Please try again later.'});
        }
        // Success, show our new libraries
        else
        {
            setLibraries(res.result);
        }
        
        setLoading(false);
    };
    
    const RenderLibraryRow = (row_props) =>
    {
        return(
            <TouchableOpacity style={styles.row_container} onPress={() => { props.onViewProduct(row_props.item.product_id) }}>
                <Text style={styles.product_title}>{row_props.item.name}</Text>
            </TouchableOpacity>
        );
    };
    
    const LibraryRowHeader = (header_props) =>
    {
        return(
            <TouchableOpacity style={styles.row_header} onPress={() => { props.onAddProduct(header_props) }}>
            </TouchableOpacity>
        );
    };

    useEffect(() => {
        FetchUserLibraries();
    }, [props.session]);

    if(loading)
    {
        return <ActivityIndicator color="#fff" />;
    }

    const rows = [];

    rows.push(
        <Text style={styles.page_title} key={'PageTitle'}>
            {'Libraries'}
        </Text>
    );
    
    for(let i = 0; i < libraries.length; i++)
    {
        rows.push(
            <TouchableOpacity style={styles.row_title} onPress={() => { props.onViewLibrary(libraries[i]) }}>
                <Text style={styles.row_title} key={libraries[i].id}>
                    {libraries[i].library_name}
                </Text>
            </TouchableOpacity>
            );
        rows.push(
            <FlatList
                key={libraries[i].id}
                data={libraries[i].product_ids}
                renderItem={RenderLibraryRow}
                keyExtractor={item => item.product_id}
                horizontal={true}
                ListHeaderComponent={() => { return LibraryRowHeader(libraries[i].id) }}
            />
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
        height: 140,
        width: 140,
        backgroundColor: '#FF0000',
        borderRadius: 10,
        marginLeft: 10,
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
    row_header: {
        height: 140,
        width: 50,
        backgroundColor: '#0000FF',
        borderRadius: 10,
    },
})