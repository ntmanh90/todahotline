import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import storeData from '../../hooks/storeData';
import { Input, Button } from 'react-native-elements';
import { getHub, getHubAndReconnect } from '../../hubmanager/HubManager';
import useLogout from '../../hooks/useLogout';
import * as RootNavigation from '../../navigation/RootNavigation';
import keyStoreData from '../../utils/keyStoreData';

var conn = getHubAndReconnect();

function BanPhim({ navigation }) {
    const [soDienThoai, setSoDienThoai] = useState('');
    const [sdt, setSdt] = useState('');
    const useLogoutHook = useLogout();

    const handleLogout = () => {
        useLogoutHook.logOut().then(() => {
            RootNavigation.navigate('Login');
        });
    }

    const getSDT = async () => {
        let sip_user = await storeData.getStoreDataObject(keyStoreData.sip_user);
        console.log(sip_user);
        setSdt(sip_user.user);
    }

    const cuocGoiDi = () => {
        if (soDienThoai.length < 3) {
            alert('Số điện thoại không đúng định dạng');
        }
        else {
            storeData.setStoreDataValue(keyStoreData.soDienThoai, soDienThoai);
            navigation.navigate('CuocGoiDi', { soDienThoai: soDienThoai, hoTen: soDienThoai });
        }
    }

    React.useEffect(() => {
        conn = getHubAndReconnect();
        const unsubscribe = navigation.addListener('focus', () => {
            getSDT();
        });

        return unsubscribe;
    }, [navigation]);

    return (
        <View style={styles.container}>
            <Text>Số của bạn: {sdt}</Text>
            <Text>Số điện thoại</Text>
            <Input
                onChangeText={(value) => setSoDienThoai(value)}
                placeholder='Nhập số gọi ra'
                leftIcon={
                    <Icon
                        name='phone'
                        size={24}
                        color='black'
                    />
                }
            />
            <Button onPress={cuocGoiDi} title='Call' />
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