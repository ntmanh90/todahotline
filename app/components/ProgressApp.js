import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

function ProgressApp(props) {
    return (
        <View
            style={{
                position: 'absolute',
                height: '100%',
                width: '100%',
                justifyContent: 'center',
                zIndex: 99,
            }}>
            <View style={{ position: 'absolute', alignSelf: 'center' }}>
                <View
                    style={{
                        backgroundColor: '#0a0a0a80',
                        paddingVertical: 10,
                        paddingHorizontal: 30,
                        borderRadius: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                    <ActivityIndicator size="large" color="white" />
                    <Text style={{ color: 'white', paddingTop: 5 }}>Loading ...</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {}
});

export default ProgressApp;