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

import { create_user_library } from '@suppsense/api-client';

interface CreateLibraryProps
{
    isVisible: boolean;
    onCancel: () => void;
    onComplete: () => void;
    session: StoredSession;
}

export default function ModalCreateLibrary(props: CreateLibraryProps)
{
    const [library_name, set_library_name] = useState("");
    const [loading, set_loading] = useState(false);
    const canSubmit = library_name.trim() !== '';
    
    const OnCancel = async () =>
    {
        set_loading(true);
    
        // We have finished so return back to the parent
        set_library_name("");
        props.onCancel();
        
        set_loading(false);
    };
    
    const OnAccept = async () =>
    {
        set_loading(true);
        
        // Make the request to create our library. 
        const res = await create_user_library(props.session.accessToken, library_name);
        
        if(res === null || res.success !== true)
        {
            Toast.show({type: 'info', text1: 'An error occurred while creating your library!', text2: 'Please try again later.'});
        }
        // Success, show our new libraries
        else
        {
            Toast.show({type: 'info', text1: 'Library Created'});
        }
        
        // We have finished so return back to the parent
        set_library_name("");
        props.onComplete();
    
        set_loading(false);
    };

    return(
    <Modal
       animationType="slide"
       transparent={false}
       visible={props.isVisible}
       onRequestClose={() => { OnCancel(); }}
    >
        <View style={styles.centeredView}>
            <Text style={styles.page_title}>
                {'Create a new Library'}
            </Text>
        
            <TextInput
                style={styles.input}
                placeholder="My Library"
                placeholderTextColor="#888"
                value={library_name}
                autoCapitalize="none"
                onChangeText={set_library_name}
                keyboardType="default"
                editable={!loading}
            />
            <TouchableOpacity
                style={[styles.button, !canSubmit && styles.buttonDisabled]}
                onPress={OnAccept}
                disabled={!canSubmit}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Confirm</Text>
                )}
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={OnCancel}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Cancel</Text>
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
})