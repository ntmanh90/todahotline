import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList } from 'react-native';
import storeData from '../../hooks/storeData';

function LogScreen({ navigation }) {
    const [data, setData] = useState([]);

    React.useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            storeData.getStoreDataObject('dataLog').then((dataLog) => {
                setData(dataLog.reverse());
            })
        });

        return unsubscribe;
    }, [navigation]);
    return (
        <SafeAreaView style={{ flex: 1 }}>
            <FlatList data={data || []}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => {
                    // console.log('item', item);
                    return (
                        <View style={{ paddingHorizontal: 15, marginTop: 15, }}>
                            <Text style={{ color: 'black' }}>{item.index + " - " + item.logType + ": " + item.logTime}</Text>
                        </View>
                    )
                }}
            ></FlatList>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {}
});

export default LogScreen;