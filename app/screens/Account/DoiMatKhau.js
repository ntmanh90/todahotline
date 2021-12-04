import React, {useState, useEffect} from 'react';
import {
  Platform,
  View,
  SafeAreaView,
  StyleSheet,
  Text,
  Image,
  Alert,
} from 'react-native';
import {Input, Button} from 'react-native-elements';
import md5 from 'md5';
import storeData from '../../hooks/storeData';
import AppApi from '../../api/Client';
import BackgroundTimer from 'react-native-background-timer';
import TextImage from '../../components/TextImage';
import Toast from 'react-native-simple-toast';
import {Header, Icon} from 'react-native-elements';
import BaseURL from '../../utils/BaseURL';
import ProgressApp from '../../components/ProgressApp';
import keyStoreData from '../../utils/keyStoreData';
import useLogout from '../../hooks/useLogout';
import { getHubAndReconnect } from '../../hubmanager/HubManager';
import deviceInfoModule from 'react-native-device-info';

const IOS = Platform.OS === 'ios';

BackgroundTimer.start();

function DoiMatKhau({navigation}) {
  const [matKhauCu, setMatKhauCu] = useState('');
  const [matKhauMoi, setMatKhauMoi] = useState('');
  const [nhapLaiMatKhauMoi, setNhapLaiMatKhauMoi] = useState('');
  const [renderProcess, setRenderProcess] = useState(false);

  const useLogoutHook = useLogout();

  const removeDataLogin = () => {
      storeData.setStoreDataObject(keyStoreData.sip_user, {});
      storeData.setStoreDataValue(keyStoreData.tennhanvien, '');
      storeData.setStoreDataValue(keyStoreData.isLogin, false);
      setRenderProcess(false);
            Toast.showWithGravity(
              'Đổi mật khẩu thành công.',
              Toast.LONG,
              Toast.TOP,
            );
      navigation.navigate('Login');
  };

  const handleLogout = async () => {
    try {
        console.log("[Đã vào Handle Logout 1]");
        let http = await storeData.getStoreDataValue('urlApi');
        var url = http + BaseURL.URL_LOGOUT;
        let mact = await storeData.getStoreDataValue('tenct');
        let prefix = await storeData.getStoreDataValue('Prefix');
        let somayle = await storeData.getStoreDataValue('somayle');
        let idnhanvien = await storeData.getStoreDataValue('idnhanvien');
        let imei = deviceInfoModule.getUniqueId();
        
        console.log("[Đã vào Handle Logout 2]");
        var params = {
            imei: imei,
            prefix: prefix,
            mact: mact,
            somayle: somayle,
            hinhthucdangxuat: '0',
            idnhanvien: idnhanvien,
            token: '',
        };


        fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params)
        }).then((responce) => {
            var conn = getHubAndReconnect();
            //conn.invoke('SignOut').catch(); 
            if (responce.status) {
                BackgroundTimer.setTimeout(() => {
                    try {
                        conn.invoke('SignOut').catch();
                        conn.stop();
                        removeDataLogin();
                    }
                    catch (err) {
                        removeDataLogin();
                    }
                }, 1000);
                // conn.stop();
            }
        })
    } catch (error) {
        setRenderProcess(false);
    }
}


  const handleDoiMatKhau = async () => {
    if (matKhauCu == '' || matKhauMoi == '' || nhapLaiMatKhauMoi == '') {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ thông tin');
      return;
    } else {
      if (matKhauMoi != nhapLaiMatKhauMoi) {
        Alert.alert('Thông báo', 'Mật khẩu nhập lại không đúng');
        return;
      }
    }

    setRenderProcess(true);
    let urlApi = await storeData.getStoreDataValue(keyStoreData.urlApi);
    let idnv = await storeData.getStoreDataValue(keyStoreData.idnhanvien);
    let mact = await storeData.getStoreDataValue(keyStoreData.tenct);
    let username = await storeData.getStoreDataValue(keyStoreData.tendangnhap);

    var url = urlApi + BaseURL.URL_CHANGE_PASSWORD;
    var params = {
      matkhaumoi: md5(matKhauMoi),
      matkhaucu: md5(matKhauCu),
      idnhanvien: idnv,
      token: '',
      macongty: mact,
      tendangnhap: username
    };

    console.log("[URL đổi mật khẩu]: " + url);

    AppApi.RequestPOST(url, params, (err, json) => {
      console.log('[err json]', err, json);
      if (json.data.status == true) {
        handleLogout();
      } else {
        var err = json.data.msg;
        console.log('không đổi được mật khẩu');
        Alert.alert('Thông báo', err);
      }
    });
  };

  //Xin quyền gọi

  React.useEffect(() => {}, [renderProcess]);

  return (
    <>
      <SafeAreaView style={styles.container}>
        <Header
          leftComponent={
            <Icon
              name="arrow-back"
              color="#fff"
              size={22}
              onPress={() => navigation.goBack()}
            />
          }
          centerComponent={{text: 'Đổi mật khẩu', style: {color: '#fff'}}}
        />

        <View
          style={{
            marginTop: '10%',
            alignItems: 'center',
          }}>
          <Image
            source={require('../../Toda_Images/logo.png')}
            style={{
              width: 200,
              height: 100,
              resizeMode: 'contain',
              marginBottom: 10,
            }}
          />
        </View>
        <TextImage
          secureText={true}
          name="md-lock-closed-outline"
          text={matKhauCu}
          eye={true}
          placeholder={'Nhập mật khẩu cũ'}
          onChangeText={value => {
            setMatKhauCu(value);
          }}
        />
        <TextImage
          secureText={true}
          name="md-lock-closed-outline"
          text={matKhauMoi}
          eye={true}
          placeholder={'Nhập mật khẩu  mới'}
          onChangeText={value => {
            setMatKhauMoi(value);
          }}
        />
        <TextImage
          secureText={true}
          name="md-lock-closed-outline"
          text={nhapLaiMatKhauMoi}
          eye={true}
          placeholder={'Nhập lại mật khẩu mới'}
          onChangeText={value => {
            setNhapLaiMatKhauMoi(value);
          }}
        />

        <Button
          title="Đổi mật khẩu"
          onPress={handleDoiMatKhau}
          containerStyle={styles.borderButton}
          buttonStyle={{borderRadius: 20}}
        />
      </SafeAreaView>
      {renderProcess === true ? <ProgressApp /> : null}
    </>
  );
}

var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  borderButton: {
    marginTop: 30,
    marginHorizontal: 15,
  },
  text: {
    marginBottom: 5,
    fontFamily: 'Avenir Next',
    color: '#1976d2',
  },
  socialButton: {
    flexDirection: 'row',
    marginHorizontal: 12,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderWidth: 20,
    borderColor: 'rgba(171, 180, 189, 0.65)',
    borderRadius: 4,
    backgroundColor: '#fff',
    shadowColor: 'rgba(171, 180, 189, 0.35)',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 5,
  },
  socialLogo: {
    width: 16,
    height: 16,
    marginRight: 8,
  },
  link: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '500',
  },
  submitContainer: {
    backgroundColor: '#1976d2',
    fontSize: 16,
    borderRadius: 15,
    paddingVertical: 12,
    marginRight: 20,
    marginLeft: 20,
    marginTop: 25,
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FFF',
    shadowColor: 'rgba(255, 22, 84, 0.24)',
    shadowOffset: {width: 0, height: 9},
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 5,
  },
});

export default DoiMatKhau;
