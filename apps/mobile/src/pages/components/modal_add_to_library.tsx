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
    FlatList,
} from 'react-native';

import Toast from 'react-native-toast-message'

import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';
import { get_user_libraries } from '@suppsense/api-client';

//import { add_product_to_user_library } from '@suppsense/api-client';

interface AddToLibraryProps
{
    isVisible: boolean;
    product: getProductResponse;
    libraries: ProductLibrary[] | null;
    // Receives an array of all the ids of the libraries that were selected
    onComplete: (string[]) => void;
    session: StoredSession;
}

export default function ModalAddToLibrary(props: AddToLibraryProps)
{
    const [selected_libraries, set_selected_libraries] = useState<string[] | null>(null);
    const [loading, set_loading] = useState(false);
    
    if(!props.libraries)
    {
        
    }
    
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
            props.libraries = res.result;
        }
        
        setLoading(false);
    };
    
    const onDone = async () =>
    {
        set_loading(true);
                
        props.onComplete(selected_libraries);
        set_selected_libraries(null);
    
        set_loading(false);
    };
    
    const toggleSelected = (id) => {
        set_selected_libraries(prev => 
          prev.includes(id) 
            ? prev.filter(item => item !== id) 
            : [...prev, id]
        );
    };

    return(
    <Modal
       animationType="slide"
       transparent={false}
       visible={props.isVisible}
       onRequestClose={() => { set_selected_libraries(null); OnDone(); }}
    >
        <View style={styles.centeredView}>
            <Text style={styles.page_title}>
                {'Add ' + props.product.name + ' to your Libraries'}
            </Text>
        
            <FlatList
              data={props.libraries}
              keyExtractor={item => item.id}
              renderItem={({ item }) => {
                const isSelected = selected_libraries.includes(item.id);
                return (
                  <TouchableOpacity
                    style={[styles.library_row, isSelected && styles.selected_library_row]}
                    onPress={() => toggleSelected(item.id)}
                  >
                    <Text>{item.library_name}</Text>
                  </TouchableOpacity>
                );
              }}
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
        height: 40,
        width: '100%',  
    },
    selected_library_row: {
        color: '#6c6c6c'
    },
})