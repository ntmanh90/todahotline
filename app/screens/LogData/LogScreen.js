import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList } from 'react-native';
import { openDatabase } from 'react-native-sqlite-storage';
import moment from 'moment';

var db = openDatabase({ name: 'UserDatabase.db' });

function LogScreen({ navigation }) {
    const [data, setData] = useState([]);

    React.useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {

            db.transaction((tx) => {
                tx.executeSql(
                    'SELECT * FROM Log ORDER BY id DESC',
                    [],
                    (tx, { rows }) => {
                        if (rows.length > 0) {
                            let term = [];
                            for (let i = 0; i < rows.length; i++) {
                                let date = new Date(rows.item(i).logTime);
                                rows.item(i).logTime = moment(date).format('DD/mm/yyyy HH:mm:ss SSS');
                                term.push(rows.item(i));
                            }
                            setData(term);
                        }
                    },
                    (tx, error) => {
                        console.log('error list Log', tx, error);;
                    },
                );
            });

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