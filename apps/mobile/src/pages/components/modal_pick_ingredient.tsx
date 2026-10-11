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

import { IngredientSearchResult } from '@suppsense/shared-types';
import { searchIngredients } from '@suppsense/api-client';

interface PickIngredientProps
{
    isVisible: boolean;
    onCancel: () => void;
    onComplete: (chosen: IngredientSearchResult) => void;
    session: StoredSession;
}

export default function ModalPickIngredient(props: PickIngredientProps)
{
    const [ingredient_name, setIngredientName] = useState("");
    const [ingredient_results, setIngredientResults] = useState<IngredientSearchResult[]>([]);
    
    const OnCancel = async () =>
    {
        setIngredientName("");
        props.onCancel();    
    };
    
    const OnAccept = async (chosen: IngredientSearchResult) =>
    {
        setIngredientName("");
        props.onComplete(chosen);
    };
    
    const SearchNameResults = async () => {
        const res = await searchIngredients(props.session.accessToken, ingredient_name);
        
        if(res === null || res.success !== true)
        {
            Toast.show({type: 'info', text1: 'An error occurred while fetching your libraries!', text2: 'Please try again later.'});
        }
        else
        {
            setIngredientResults(res.result);
        }
    };

    useEffect(() => {
        SearchNameResults();
    }, [ingredient_name]);

    const RenderIngredientResult = (row_props) => {
        return(
            <TouchableOpacity style={styles.row_title} onPress={() => { props.onComplete(row_props.item) }}>
                <Text style={styles.row_title}>
                    {row_props.item.name}
                </Text>
            </TouchableOpacity>
        );
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
                {'Pick an ingredient'}
            </Text>
        
            <TextInput
                style={styles.input}
                placeholder="Ingredient name"
                placeholderTextColor="#888"
                value={ingredient_name}
                autoCapitalize="none"
                onChangeText={setIngredientName}
                keyboardType="default"
            />
            
            <FlatList
                data={ingredient_results}
                renderItem={RenderIngredientResult}
                keyExtractor={item => item.name}
            />
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
    row_title: {
        color: '#FFFFFF',
        fontSize: 18,
        backgroundColor: 'transparent',
        marginBottom: 1,
        marginTop: 1,
    },
})