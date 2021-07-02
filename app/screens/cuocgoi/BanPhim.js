import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import storeData from '../../hooks/storeData';
import { Input, Button } from 'react-native-elements';
import { getHub } from '../../hubmanager/HubManager';
import useLogout from '../../hooks/useLogout';

var conn = getHub();

function BanPhim({ navigation }) {
    const useLogoutHook = useLogout();

    const handleLogout = () => {

        useLogoutHook.logOut();
    }

    useEffect(() => {
        //connectServer();
    }, [])
    return (
        <View style={styles.container}>

            <Text>Số điện thoại</Text>
            <Input
                onChangeText={(value) => setMaCongTy(value)}
                placeholder='Nhập số gọi ra'
                leftIcon={
                    <Icon
                        name='phone'
                        size={24}
                        color='black'
                    />
                }
            />
            <Button title='Call' />
            <View style={{ marginTop: 40 }}>
                <Button onPress={handleLogout} title='Đăng xuất' />
            </View>
            {/* <Text onPress={() => { navigation.navigate('DienThoai') }}>Bàn phím</Text> */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {}
});

export default BanPhim;