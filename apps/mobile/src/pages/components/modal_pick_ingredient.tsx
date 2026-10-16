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

import Toast from 'react-native-toast-message';
import { Picker } from "@react-native-picker/picker";

import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';

import { IngredientSearchResult, IngredientEntry } from '@suppsense/shared-types';
import { searchIngredients } from '@suppsense/api-client';

import { colors } from './colors'

interface PickIngredientProps
{
    isVisible: boolean;
    onCancel: () => void;
    onComplete: (chosen: IngredientEntry) => void;
    session: StoredSession;
}

export default function ModalPickIngredient(props: PickIngredientProps)
{
    const [ingredient_name, setIngredientName] = useState("");
    const [ingredient_results, setIngredientResults] = useState<IngredientSearchResult[]>([]);
    const [chosen_ingredient, setChosenIngredient] = useState<IngredientSearchResult | null>(null);
    
    const [measurement_unit, setMeasurementUnit] = useState('g');
    const [ingredient_amount, setIngredientAmount] = useState('');
    
    const available_units = ['mcg', 'mg', 'g', 'ml'];
    const can_submit = parseFloat(ingredient_amount) >= 0.0;
    
    const CheckIngredientAmount = (new_amount: string) => {
        if (/^\d*\.?\d*$/.test(new_amount))
        {
            setIngredientAmount(new_amount);
        }
        else
        {
            setIngredientAmount(ingredient_amount);
        }
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

    const TrySubmit = () =>
    {
        const final_amount = parseFloat(ingredient_amount);
        if(final_amount <= 0.0)
        {
            return;
        }
        
        props.onComplete({ id: chosen_ingredient.id, name: chosen_ingredient.name, unit: measurement_unit, amount: final_amount });
    };

    useEffect(() => {
        SearchNameResults();
    }, [ingredient_name]);

    const RenderIngredientResult = (row_props) => {
        return(
            <TouchableOpacity style={styles.row_container} onPress={() => { setChosenIngredient(row_props.item) }}>
                <Text style={styles.row_title}>
                    {row_props.item.name}
                </Text>
            </TouchableOpacity>
        );
    };

    const RenderIngredientPicker = () => {
        return(
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
                    style={styles.list}
                    data={ingredient_results}
                    renderItem={RenderIngredientResult}
                    keyExtractor={item => item.name}
                />
                
                <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={props.onCancel}
                >
                    <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const RenderIngredientAmountEntry = () => {
        return(
            <View style={styles.centeredView}>
                <Text style={styles.page_title}>
                    {'Enter the single dose amount for ' + chosen_ingredient.name}
                </Text>
                
                <View style={styles.amount_entry_row}>
                    <TextInput
                        style={styles.amount_input}
                        placeholder="0.00"
                        placeholderTextColor="#888"
                        value={ingredient_amount}
                        autoCapitalize="none"
                        onChangeText={CheckIngredientAmount}
                        keyboardType="decimal-pad"
                    />
                    
                    <Picker
                        selectedValue={measurement_unit}
                        onValueChange={(val) => setMeasurementUnit(val)}
                        style={styles.picker}
                    >
                        {
                            available_units.map((item, idx) => (
                                <Picker.Item label={item} value={item} />
                            ))
                        }
                    </Picker>
                </View>
                
                <TouchableOpacity
                    style={[styles.button, !can_submit && styles.buttonDisabled]}
                    onPress={TrySubmit}
                    disabled={!can_submit}
                >
                    <Text style={styles.buttonText}>Finish</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={props.onCancel}
                >
                    <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return(
    <Modal
       animationType="slide"
       transparent={false}
       visible={props.isVisible}
       onRequestClose={() => { props.onCancel(); }}
    >
        { 
            !chosen_ingredient ? <RenderIngredientPicker /> : <RenderIngredientAmountEntry />
        }
    </Modal>
    );
}

const styles = StyleSheet.create({
    centeredView: {
        backgroundColor: colors.bg,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        padding: 20,
    },
    page_title: {
        color: colors.txt,
        fontSize: 30,
        backgroundColor: 'transparent'
    },
    input: {
        width: '100%',
        height: 50,
        borderColor: colors.txt,
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 15,
        color: colors.txt,
    },
    button: {
        width: '100%',
        height: 50,
        backgroundColor: colors.button_bg,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 5,
        marginTop: 10,
    },
    list: {
        width: '100%', 
    },
    buttonDisabled: {
        backgroundColor: colors.disable_button_bg,
    },
    cancelButton: {
        backgroundColor: colors.cancel_button_bg,
    },
    buttonText: {
        color: colors.button_txt,
        fontSize: 16,
        fontWeight: 'bold',
    },
    row_title: {
        color: colors.button_txt,
        fontSize: 18,
        backgroundColor: 'transparent',
        marginBottom: 1,
        marginTop: 1,
    },
    row_container: {
        height: 50,
        padding: 10,
        borderRadius: 10,
        width: '100%',
        backgroundColor: colors.disabled_button_bg,
        marginBottom: 1,
        marginTop: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    picker: {
        width: 90,
        borderWidth: 1,
        borderColor: colors.txt,
        height: '100%',
        marginLeft: 'auto',
        color: colors.button_txt,
    },
    amount_entry_row: {
        height: 60,
        borderRadius: 10,
        width: '90%',
        backgroundColor: colors.disabled_button_bg,
        marginBottom: 1,
        marginTop: 1,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    amount_input: {
        width: 80,
        height: '100%',
        color: colors.button_txt,
    },
})