import { useEffect, useState } from 'react';
import { 
    ScrollView,
    FlatList,
    Text,
    View,
    TextInput,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Image,
    Modal,
} from 'react-native';

import Toast from 'react-native-toast-message'

import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';
import { get_user_libraries, add_product_to_user_library } from '@suppsense/api-client';

import { getProductResponse, ProductLibrary } from '@suppsense/shared-types';

interface AddToLibraryProps
{
    isVisible: boolean;
    product: getProductResponse;
    libraries: ProductLibrary[] | null;
    // @arg is true if the product was added and we need to reload the libraries and false otherwise
    onComplete: (boolean) => void;
    session: StoredSession;
}

export default function ModalAddToLibrary(props: AddToLibraryProps)
{
    const [selected_libraries, setSelectedLibraries] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [libraries, setLibraries] = useState<ProductLibrary[] | null>(props.libraries);
    
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
    
    if(!libraries)
    {
        FetchUserLibraries();
    }
     
    const onDone = async () =>
    {
        setLoading(true);
        
        const should_reload_libraries = selected_libraries.length > 0;
        for(let i = 0; i < selected_libraries.length; i++)
        {
            const res = await add_product_to_user_library(props.session.accessToken, selected_libraries[i], props.product.id);
        }
        
        setSelectedLibraries([]);
        props.onComplete(should_reload_libraries);
    
        setLoading(false);
    };
    
    const toggleSelected = (id) => {
        setSelectedLibraries(prev => 
          prev.includes(id) 
            ? prev.filter(item => item !== id) 
            : [...prev, id]
        );
    };

    const RenderLibraryRow = (row_props) => {
        const isSelected = selected_libraries.includes(row_props.item.id);
        return (
          <TouchableOpacity
            style={[styles.library_row, isSelected && styles.selected_library_row]}
            onPress={() => toggleSelected(row_props.item.id)}
          >
            <Text style={styles.library_row_text}>{row_props.item.library_name}</Text>
          </TouchableOpacity>
        );
    };

    return(
    <Modal
       animationType="slide"
       transparent={false}
       visible={props.isVisible}
       onRequestClose={() => { setSelectedLibraries(); OnDone(); }}
    >
        <View style={styles.centeredView}>
            <Text style={styles.page_title}>
                {'Add ' + props.product.name + ' to your Libraries'}
            </Text>
        
            <FlatList
                style={styles.library_list}
                data={libraries}
                keyExtractor={item => item.id}
                renderItem={RenderLibraryRow}
            />
        
            <TouchableOpacity
                style={styles.button}
                onPress={onDone}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Done</Text>
                )}
            </TouchableOpacity>
        </View>
    </Modal>
    );

}

const styles = StyleSheet.create({
    centeredView: {
        backgroundColor: '#0f0f0f',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        padding: 20,
    },
    page_title: {
        color: '#FFFFFF',
        fontSize: 30,
        backgroundColor: 'transparent'
    },
    input: {
        width: '100%',
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 15,
        color: '#fff',
    },
    button: {
        width: '100%',
        height: 50,
        backgroundColor: '#0f62fe',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 5,
        marginTop: 10,
    },
    buttonDisabled: {
        backgroundColor: '#555',
    },
    cancelButton: {
        backgroundColor: '#FFaaaa',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    library_row: {
        height: 50,
        width: '100%',
        backgroundColor: '#6c6c6c',
        padding: 10,
        borderRadius: 10,
        marginBottom: 5,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    library_row_text: {
        color: '#FFFFFF',
        fontSize: 18,
    },
    selected_library_row: {
        backgroundColor: '#9c9c9c'
    },
    library_list: {
        width: '90%',
    },
})