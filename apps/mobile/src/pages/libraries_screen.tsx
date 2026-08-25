import React, { useState } from 'react';
import { 
    ScrollView,
    Text,
    StyleSheet,
    ActivityIndicator
} from 'react-native';

interface LibrariesProps
{
    ;
}

export default function LibrariesScreen(props: LibrariesProps)
{
    
    return(
        <ScrollView style={styles.outer_div}>
            
        </ScrollView>
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
})