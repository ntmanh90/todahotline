import React, {useState, useEffect} from 'react';
import {
  Platform,
  View,
  SafeAreaView,
  StyleSheet,
  Text,
  Image,
  PermissionsAndroid,
} from 'react-native';
import {Input, Button} from 'react-native-elements';
import messaging from '@react-native-firebase/messaging';
import DeviceInfo from 'react-native-device-info';
import BaseUrl from '../../utils/BaseURL';
import md5 from 'md5';
import jwt_decode from 'jwt-decode';
import storeData from '../../hooks/storeData';
import AppApi from '../../api/Client';
import {getHub, connectServer} from '../../hubmanager/HubManager';
import BackgroundTimer from 'react-native-background-timer';
import TextImage from '../../components/TextImage';
import Toast from 'react-native-simple-toast';
import BaseURL from '../../utils/BaseURL';
import ProgressApp from '../../components/ProgressApp';
import keyStoreData from '../../utils/keyStoreData';
import CuocGoiDB from '../../database/CuocGoiDB';
import useCheckPermistion from '../../hooks/useCheckPermistion';
import InCallManager from 'react-native-incall-manager';

const isIOS = Platform.OS === 'ios';

BackgroundTimer.start();

function Login({navigation}) {
  const [maCongTy, setMaCongTy] = useState('');
  const [tenDangNhap, setTenDangNhap] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [renderProcess, setRenderProcess] = useState(true);
  const check_Permission = useCheckPermistion();

  const handleLogin = async () => {
    console.log('[handleLogin]');
    let idpush = '';
    idpush = await messaging().getToken();
    console.log('idpush', idpush);
    let idpushkit = '';
    if (isIOS) {
      idpushkit = (await storeData.getStoreDataValue('tokenPuskit')) || '';
      console.log(idpushkit);
    }
    
    let deviceName = await DeviceInfo.getDeviceName();

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
    console.log('http', http);
    console.log('params', params);

    AppApi.RequestPOST(url, params, (err, json) => {
      //setRenderProcess(true);
      console.log('Error login: ', err);
      if (!err) {
        if (json.data.status) {
          console.log('???? tr??? v??? data');
          var keyUser = json.data.data.usertoda;
          var daonguocma = keyUser.split('').reverse().join('');
          var decodedUser = jwt_decode(daonguocma);
          console.log('sipUser', decodedUser);
          decodedUser.idct = String(json.data.data.idct);
          decodedUser.mact = maCongTy;
          storeData.setStoreDataObject('sip_user', decodedUser);
          console.log('Idnhanvien', json.data.data.idnhanvien);
          storeData.setStoreDataValue(
            'tennhanvien',
            json.data.data.tennhanvien,
          );
          storeData.setStoreDataValue('somayle', json.data.data.somayle);
          storeData.setStoreDataValue(
            keyStoreData.tendangnhap,
            json.data.data.tendangnhap,
          );
          storeData.setStoreDataValue(
            'idnhanvien',
            String(json.data.data.idnhanvien),
          );
          storeData.setStoreDataValue('chucvu', json.data.data.chucvu);
          storeData.setStoreDataValue('idct', String(json.data.data.idct));

          storeData.setStoreDataValue(
            'quyenGoiRa',
            String(json.data.data.ChoPhepGoiRa),
          );
          storeData.setStoreDataValue('Prefix', json.data.data.Prefix);
          storeData.setStoreDataValue(keyStoreData.isLogin, true);
          // DefaultPreference.set('Prefix', JSON.stringify({ data: json.data.data.Prefix })).then((value) => { console.log("DefaultPreference Contacts: ", value) })
          AppApi.RequestGET(
            'https://signaltest.ksmart.vn/api/Token/' + json.data.data.somayle,
            '',
            (err, json) => {
              if (!err) {
                console.log('Token: ', json);
              }
            },
          );

          BackgroundTimer.setTimeout(() => {
            connectServer(true);
          }, 300);
          setRenderProcess(false);

          navigation.navigate('BanPhim');
          return true;
        } else {
          Toast.showWithGravity(
            'Th??ng tin ????ng nh???p kh??ng ????ng.',
            Toast.LONG,
            Toast.TOP,
          );
          setRenderProcess(false);
          return false;
        }
      } else {
        setRenderProcess(false);
        alert('Vui l??ng ki???m tra l???i internet !!!');
        return false;
      }
    });
  };

  const LoginApi = async () => {
    createTableDatabase();
    setRenderProcess(true);
    storeData.setStoreDataValue(keyStoreData.tenct, maCongTy);
    storeData.setStoreDataValue('UserName', tenDangNhap);
    storeData.setStoreDataValue('PassWord', matKhau);

    if (
      tenDangNhap.length == 0 ||
      matKhau.length == 0 ||
      maCongTy.length == 0
    ) {
      Toast.showWithGravity(
        'Xin m???i nh???p ?????y ????? th??ng tin.',
        Toast.LONG,
        Toast.TOP,
      );
      setRenderProcess(false);
      return;
    }

    var params = 'idct=' + maCongTy;
    var url = BaseUrl.URL_LOGININFO + params;
    console.log(url);
    fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
      .then(response => response.json())
      .then(async responseJson => {
        console.log('responseJson', responseJson.data);
        if (responseJson.data) {
          var maurl = responseJson.data.serviceURL;
          var link = maurl.split('').reverse().join('');
          var decoded = jwt_decode(link);
          var url = decoded.ServiceURL;
          console.log('url server: ', url);
          storeData.setStoreDataValue('urlApi', url);

          var checkLogin = await handleLogin();
        } else {
          Toast.showWithGravity(
            'M?? c??ng ty kh??ng ????ng.',
            Toast.LONG,
            Toast.TOP,
          );
        }
      })
      .catch(error => {
        setRenderProcess(false);
        Toast.show('Vui l??ng ki???m tra l???i internet !!!', Toast.LONG, Toast.TOP);
        callback(error, null);
      })
      .finally();
    BackgroundTimer.setTimeout(() => {
      setRenderProcess(false);
    }, 500);
  };

  //Tao bang sqlite
  const createTableDatabase = () => {
    console.log('[t???o b???ng database]');
    BackgroundTimer.setTimeout(() => {
      CuocGoiDB.initTable();
    }, 2000);
  };

  const layThongTinDangNhap = async () => {
    let userName = await storeData.getStoreDataValue('UserName');
    let tennhanvien = await storeData.getStoreDataValue(
      keyStoreData.tennhanvien,
    );
    setTenDangNhap(userName);
    let tenct = await storeData.getStoreDataValue('tenct');
    setMaCongTy(tenct);
    let passWord = await storeData.getStoreDataValue('PassWord');
    setMatKhau(passWord);
    let isLogin = await storeData.getStoreDataValue(keyStoreData.isLogin);
    console.log('[tennhanvien]', isLogin, tennhanvien);
    if (isLogin == 'true' && tennhanvien != '' && tennhanvien != null) {
      navigation.navigate('BanPhim');
    }
  };

  //Xin quy???n g???i
  const requestPermissionsAndroid = () => {
    if (!isIOS) {
      PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_CONTACTS, {
        title: 'Contacts',
        message: 'This app would like to view your contacts.',
        buttonPositive: 'Please accept bare mortal',
      }).then(() => {
        check_Permission.requestCallPhonePermission().then(() => {
          if (check_Permission.callPhone === false) {
            Alert.alert(
              'Th??ng b??o',
              'B???n ch??a c???p quy???n ??i???n tho???i ?',
              [
                {
                  text: 'C???p quy???n',
                  onPress: () => {
                    check_Permission.requestCallPhonePermission();
                  },
                },
              ],
              {cancelable: false},
            );
          } else {
            check_Permission.requestRecordAudioPermission().then(() => {
              if (check_Permission.recordAudio === false) {
                Alert.alert(
                  'Th??ng b??o',
                  'B???n ch??a c???p quy???n microphone ?',
                  [
                    {
                      text: 'C???p quy???n',
                      onPress: () => {
                        check_Permission.requestRecordAudioPermission();
                      },
                    },
                  ],
                  {cancelable: false},
                );
              } else {
                DeviceInfo.getApiLevel().then(apiLevel => {
                  if (apiLevel < 30) {
                    check_Permission
                      .requestReadPhoneStatePermission()
                      .then(() => {
                        if (check_Permission.readPhoneState === false) {
                          Alert.alert(
                            'Th??ng b??o',
                            'B???n ch??a c???p quy???n t??i kho???n cu???c g???i ?',
                            [
                              {
                                text: 'C???p quy???n',
                                onPress: () => {
                                  check_Permission.requestReadPhoneStatePermission();
                                },
                              },
                            ],
                            {cancelable: false},
                          );
                        }
                      });
                  }
                });
              }
            });
          }
        });
      });
    } else {
      if (InCallManager.recordPermission !== 'granted') {
        InCallManager.requestRecordPermission();
      }
    }
  };

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      layThongTinDangNhap();
      createTableDatabase();
      BackgroundTimer.setTimeout(() => {
        requestPermissionsAndroid();
        setRenderProcess(false);
      }, 2000);
    });
    return () => {
      unsubscribe;
    };
  }, [navigation]);

  useEffect(() => {
    console.log(renderProcess);
  }, [renderProcess]);

  return (
    <>
      <View style={styles.container}>
        <View
          style={{
            marginTop: '15%',
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
          name="home"
          text={maCongTy}
          placeholder={'Nh???p m?? c??ng ty'}
          onChangeText={value => {
            setMaCongTy(value);
          }}
        />

        <TextImage
          name="person"
          text={tenDangNhap}
          placeholder={'Nh???p t??n ????ng nh???p'}
          onChangeText={value => {
            setTenDangNhap(value);
          }}
        />
        <TextImage
          secureText={true}
          name="md-lock-closed-outline"
          text={matKhau}
          eye={true}
          placeholder={'Nh???p m???t kh???u'}
          onChangeText={value => {
            setMatKhau(value);
          }}
        />

        <Button
          title="????ng nh???p"
          onPress={LoginApi}
          containerStyle={styles.borderButton}
          buttonStyle={{borderRadius: 20}}
        />

        <Text
          style={[
            styles.text,
            {
              fontSize: 14,
              color: '#ABB4BD',
              textAlign: 'center',
              marginTop: 24,
            },
          ]}>
          <Text style={[styles.text, styles.link]}>
            Phi??n b???n {BaseURL.VERSION}
          </Text>
        </Text>
      </View>

      {renderProcess == true ? <ProgressApp /> : null}
    </>
  );
}

var styles = StyleSheet.create({
  container: {
    //justifyContent: 'center',
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 15,
  },
  borderButton: {
    marginTop: 30,
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

export default Login;
