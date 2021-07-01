import React, { useState } from 'react';
import { Platform, View, SafeAreaView, StyleSheet, Text, Button } from 'react-native';
import { Input } from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';
import messaging from "@react-native-firebase/messaging";
import DeviceInfo from 'react-native-device-info';
import BaseUrl from '../../utils/BaseURL';
import md5 from 'md5';
import jwt_decode from 'jwt-decode';
import storeData from '../../hooks/storeData';
import AppApi from '../../api/Client';


function Login({ navigation }) {
    const [maCongTy, setMaCongTy] = useState('');
    const [tenDangNhap, setTenDangNhap] = useState('');
    const [matKhau, setMatKhau] = useState('');

    const handleLogin = async () => {
        let idpush = await messaging().getToken();
        let idpushkit = ''
        if (Platform.OS == 'ios') {
            idpushkit = await storeData.getStoreDataValue('tokenPuskit') ?? '';
        }
        let deviceName = await DeviceInfo.getDeviceName()

        var params = {
            idct: maCongTy,
            taikhoan: tenDangNhap,
            matkhau: md5(matKhau),
            ver: BaseUrl.VERSION,
            os: Platform.OS == 'ios' ? 1 : 2,
            dongmay: DeviceInfo.getBrand(),
            idpush: idpush,
            idpushkit: idpushkit,
            imei: DeviceInfo.getUniqueId(),
            devicename: deviceName,
            osversion: DeviceInfo.getSystemVersion(),
            token: '',
        };

        let http = await storeData.getStoreDataValue('urlApi');
        var url = http + BaseUrl.URL_LOGIN;

        AppApi.RequestPOST(url, params, (err, json) => {
            console.log('Error login: ', err);
            if (!err) {
                if (json.data.status) {
                    console.log('đã trả về data');
                    var keyUser = json.data.data.usertoda;
                    var daonguocma = keyUser.split('').reverse().join('');
                    var decodedUser = jwt_decode(daonguocma);
                    console.log('sipUser', decodedUser);
                    decodedUser.idct = String(json.data.data.idct)
                    decodedUser.mact = maCongTy
                    storeData.setStoreDataObject('sip_user', JSON.stringify(decodedUser));
                    console.log('Idnhanvien', json.data.data.idnhanvien);
                    storeData.setStoreDataValue('tennhanvien', json.data.data.tennhanvien);
                    storeData.setStoreDataValue('somayle', json.data.data.somayle);
                    storeData.setStoreDataValue('tendangnhap', json.data.data.tendangnhap);
                    storeData.setStoreDataValue('idnhanvien', String(json.data.data.idnhanvien));
                    storeData.setStoreDataValue('chucvu', json.data.data.chucvu);
                    storeData.setStoreDataValue('idct', String(json.data.data.idct));
                    // storeData.setStoreDataValue('isCheck', JSON.stringify(this.state.remember));
                    storeData.setStoreDataValue('quyenGoiRa', String(json.data.data.ChoPhepGoiRa));
                    storeData.setStoreDataValue('Prefix', json.data.data.Prefix);
                    storeData.setStoreDataValue('isLogin', JSON.stringify(true));
                    // DefaultPreference.set('Prefix', JSON.stringify({ data: json.data.data.Prefix })).then((value) => { console.log("DefaultPreference Contacts: ", value) })
                    AppApi.RequestGET("https://signaltest.ksmart.vn/api/Token/" + json.data.data.somayle, "", (err, json) => {
                        if (!err) {
                            console.log("Token: ", json)
                        }
                    })

                    navigation.navigate('BanPhim');

                } else {
                    alert('Kết nối thất bại kiểm tra lại mã công ty !!!');
                }
            } else {
                this.setState({ showProcess: false });
                alert('Vui lòng kiểm tra lại internet !!!');
            }

        });
    }


    const LoginApi = async () => {
        console.log('vapf');
        var params = 'idct=' + maCongTy;
        var url = BaseUrl.URL_LOGININFO + params;
        console.log(url);
        fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        })
            .then((response) => response.json())
            .then((responseJson) => {
                var maurl = responseJson.data.serviceURL;
                var link = maurl.split('').reverse().join('');
                var decoded = jwt_decode(link);
                var url = decoded.ServiceURL;
                storeData.setStoreDataValue('urlApi', url);

                handleLogin();
            })
            .catch((error) => {
                callback(error, null);
            })
            .finally();



    }

    return (
        <SafeAreaView style={styles.container}>
            <Text>Mã công ty</Text>
            <Input
                onChangeText={(value) => setMaCongTy(value)}
                placeholder='Nhập mã công ty'
                leftIcon={
                    <Icon
                        name='home'
                        size={24}
                        color='black'
                    />
                }
            />
            <Text>Tên đăng nhập</Text>
            <Input
                onChangeText={(value) => setTenDangNhap(value)}
                placeholder='Nhập tên đăng nhập'
                leftIcon={
                    <Icon
                        name='user'
                        size={24}
                        color='black'
                    />
                }
            />
            <Text>Mật khẩu</Text>
            <Input
                onChangeText={(value) => setMatKhau(value)}
                placeholder='Nhập mật khẩu'
                secureTextEntry={true}
                leftIcon={
                    <Icon
                        name='lock'
                        size={24}
                        color='black'
                    />
                }
            />

            <Button
                title="Đăng nhập"
                onPress={LoginApi}
            />
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    container: { margin: 20, }
});

export default Login;