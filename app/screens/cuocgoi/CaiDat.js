import React from 'react';
import { View, StyleSheet, Button } from 'react-native';
import useLogout from '../../hooks/useLogout';
import { getHub, getHubAndReconnect } from '../../hubmanager/HubManager';

var conn = getHubAndReconnect();

function CaiDat({ navigation }) {
    const useLogoutHook = useLogout();

    const handleLogout = () => {
        useLogoutHook.logOut().then(() => {
            console.log('đã xử lý xong vấn đề logout');
            navigation.navigate('Login');
        });
    }

    return (
        <View style={styles.container}>
            <View style={{ marginTop: 40 }}>
                <Button onPress={handleLogout} title='Đăng xuất' />
            </View>
            <View style={{ marginTop: 40 }}>
                <Button onPress={() => navigation.navigate('LogScreen')} title='Show Log' />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {}
});

export default CaiDat;