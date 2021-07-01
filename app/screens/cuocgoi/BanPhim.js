import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

function BanPhim({ navigation }) {
    return (
        <View style={styles.container}>
            <Text onPress={() => { navigation.navigate('DienThoai') }}>Bàn phím</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {}
});

export default BanPhim;