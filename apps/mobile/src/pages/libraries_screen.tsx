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

import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';

import Toast from 'react-native-toast-message'

import { get_user_libraries, getProductById } from '@suppsense/api-client';
import { ProductLibrary } from '@suppsense/shared-types';
import { StoredSession } from '../auth/auth';
import LibraryScreen from './library_screen';
import ProductDisplay from './product_display'
import IngredientOverview from './ingredient_overview'
import ModalCreateLibrary from './components/modal_create_library'

interface LibrariesProps
{
    onExit: () => void;
    onAddProduct: (string) => void;
    session: StoredSession;
}

export default function LibrariesScreen(props: LibrariesProps)
{
    const [loading, setLoading] = useState(true);
    const [libraries, setLibraries] = useState([]);
    const [activeLibrary, setActiveLibrary] = useState<ProductLibrary | null>(null);
    const [activeProduct, setActiveProduct] = useState<getProductResponse | null>(null);
    const [activeIngredientId, setActiveIngredientId] = useState<string | null>(null);

    const [creatingLibrary, setCreatingLibrary] = useState(false);

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

    const FetchActiveProduct = async (lib_id: string) =>
    {
        const res = await getProductById(props.session.accessToken, lib_id);
    
        if(res === null || res.success !== true)
        {
            Toast.show({type: 'info', text1: 'An error occurred while fetching your product!', text2: 'Please try again later.'});
        }
        else
        {
            setActiveProduct(res.result);
        }
        
    };
    
    const RenderLibraryRow = (row_props) =>
    {
        return(
            <TouchableOpacity style={styles.row_container} onPress={() => { FetchActiveProduct(row_props.item.product_id) }}>
                <Image source={{ uri: row_props.item.image_url }} style={styles.product_thumbnail}/>
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

    if(activeIngredientId)
    {
        return <IngredientOverview ingredientName={activeIngredientId} onBack={() => setActiveIngredientId(null)} />;
    }

    if(activeProduct)
    {
        return <ProductDisplay product={activeProduct} onBack={() => setActiveProduct(null)} onIngredientPress={(id: string) => { setActiveIngredientId(id) }}/>;
    }

    if(activeLibrary)
    {
        return(
            <LibraryScreen 
                session={props.session}
                onExit={() => setActiveLibrary(null)}
                onViewProduct={(product_id) => { FetchActiveProduct(product_id) }}
                onAddProduct={props.onAddProduct}
                libraryData={activeLibrary}
            />
        );
    }

    const rows = [];

    rows.push(
        <View key={'PageTitle'} style={styles.page_header}>
            <Text style={styles.page_title} >
                {'Libraries'}
            </Text>
            <TouchableOpacity style={styles.add_library_button} onPress={() => { setCreatingLibrary(true) }}>
                <Text style={styles.page_title}>
                {"+"}
                </Text>
            </TouchableOpacity>
        </View>
    );
    
    for(let i = 0; i < libraries.length; i++)
    {
        rows.push(
            <TouchableOpacity style={styles.row_title} onPress={() => { setActiveLibrary(libraries[i]) }}  key={libraries[i].id + 'name'}>
                <Text style={styles.row_title}>
                    {libraries[i].library_name}
                </Text>
            </TouchableOpacity>
            );
        rows.push(
            <FlatList
                key={libraries[i].id}
                data={libraries[i].product_ids}
                renderItem={RenderLibraryRow}
                keyExtractor={item => item.product_id + libraries[i].id}
                horizontal={true}
                ListHeaderComponent={() => { return LibraryRowHeader(libraries[i].id) }}
            />
        );
    }

    return(
        <SafeAreaProvider>
            <SafeAreaView style={styles.outer_div}>
                <ModalCreateLibrary isVisible={creatingLibrary} session={props.session} onCancel={() => setCreatingLibrary(false)} onComplete={() => setCreatingLibrary(false)}/>
                
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
        backgroundColor: '#606060',
        borderRadius: 10,
        marginLeft: 10,
        overflow: 'hidden',
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
    page_header: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    add_library_button:
    {
        color: '#FFFFFF',
        fontSize: 30,
        backgroundColor: 'transparent',
        marginLeft: 10,
        borderRadius: 10,
        backgroundColor: '#0000FF',
        height: 30,
        width: 30,
        padding: 'auto',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    row_header: {
        height: 140,
        width: 50,
        backgroundColor: '#0000FF',
        borderRadius: 10,
    },
    product_thumbnail: {
        height: '100%',
        width: '100%',
    },
})