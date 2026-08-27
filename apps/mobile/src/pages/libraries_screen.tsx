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
import { StoredSession } from '../auth/auth';

interface LibrariesProps
{
    onExit: () => void;
    session: StoredSession;
}

function RenderLibraryRow(props)
{
    return(
        <View style={styles.row_container}>
            <Text style={styles.row_title}>{props.item.name}</Text>
        </View>
    );
}

function LibraryRowHeader(props)
{
    return(
        <TouchableOpacity style={styles.row_header} onPress={() => {console.log(props)}}>
        </TouchableOpacity>
    )
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
            <Text style={styles.row_title} key={libraries[i].id}>
                {libraries[i].library_name}
            </Text>
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
    },
    row_container: {
        height: 140,
        width: 140,
        backgroundColor: '#FF0000',
        borderRadius: 10,
        marginLeft: 10,
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