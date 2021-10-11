import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, FlatList } from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../theme/colors';
import textStyles from '../theme/textStyles';


export default function DrawerContent({ navigation }) {

    // const getDataApi = useApi(getData.listMenu);

    // useEffect(() => {
    //     getDataApi.request();
    // }, [])

    return (
        <ScrollView style={{ backgroundColor: 'white' }}>

            {/* <FlatList
                style={styles.rowMenu}
                data={getDataApi.data.data}
                renderItem={({ item }) =>
                    <TouchableOpacity onPress={() => navigation.navigate('DienThoai')}>
                        <View style={styles.ItemMenu}>
                            <Text style={styles.title} >{item.title} </Text>
                        </View>
                    </TouchableOpacity>
                }
                //Setting the number of column
                keyExtractor={(item, index) => index.toString()}
            /> */}


        </ScrollView>
    );
}

const styles = StyleSheet.create({
    rowMenu: {
        marginVertical: 30,
    },
    ItemMenu: {
        justifyContent: 'center',
        flex: 1,
        borderRadius: 15,
        marginHorizontal: 15,
        marginBottom: 15,
        paddingVertical: 5,
        borderColor: colors.border,
        borderWidth: 1,
    },
    icon: {
        alignSelf: 'center',
    },
    title: {
        fontSize: textStyles.small,
        textAlign: 'center',
    }
});
