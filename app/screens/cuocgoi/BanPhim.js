import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
  SafeAreaView,
  Alert,
  TouchableOpacity,
  FlatList,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ProgressApp from '../../components/ProgressApp';
import storeData from '../../hooks/storeData';
import keyStoreData from '../../utils/keyStoreData';
import useCheckPermistion from '../../hooks/useCheckPermistion';
import KeypadButton from '../../components/KeypadButton';
import Clipboard from '@react-native-community/clipboard';
import dongBoDanhBaHeThong from '../../utils/dongBoDanhBaHeThong';
import DeviceInfo from 'react-native-device-info';
import {openDatabase} from 'react-native-sqlite-storage';
import Tooltip from 'react-native-walkthrough-tooltip';

import typeCallEnum from '../../utils/typeCallEnum';
import BaseURL from '../../utils/BaseURL';
import AppApi from '../../api/Client';
import RNRestart from 'react-native-restart';
import logData from '../../utils/logData';
import NetInfo from '@react-native-community/netinfo';
import Toast from 'react-native-simple-toast';
import Contacts from 'react-native-contacts';

const IOS = Platform.OS === 'ios';
var db = openDatabase({name: 'UserDatabase.db'});

function BanPhim({navigation}) {
  const [soDienThoai, setSoDienThoai] = useState('');
  const [listSearhDanhBa, setListSearhDanhBa] = useState([]);
  const [checkDongBoDanhBa, setCheckDongBoDanhBa] = useState(false);
  const [showTip, setTip] = useState(false);
  const [copyOrParse, setCopyOrParse] = useState('Copy');
  const check_Permission = useCheckPermistion();

  const cuocGoiDi = async () => {
    if (soDienThoai.length < 3) {
      alert('Số điện thoại không đúng định dạng');
      return;
    } else if (soDienThoai.length > 9) {
      let quyengoiSDT = await storeData.getStoreDataValue(
        keyStoreData.quyenGoiRa,
      );
      if (quyengoiSDT != '1') {
        alert('Bạn không có quyền gọi ra');
        return;
      }
    }

    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        let termHoTen = soDienThoai;
        db.transaction(tx => {
          tx.executeSql(
            'SELECT * FROM DanhBa WHERE so_dien_thoai = ?',
            [soDienThoai],
            (tx, {rows}) => {
              console.log('getHoTenTheoSoDienThoai', rows);
              if (rows.length > 0) {
                termHoTen = rows.item(0).ho_ten;
              }
            },
            (tx, error) => {
              console.log('Error check tên số điện thoại ', error);
            },
          );
        });
        storeData.setStoreDataValue(keyStoreData.soDienThoaiDi, soDienThoai);
        storeData.setStoreDataValue(keyStoreData.hoTenDienThoaiDi, termHoTen);
        storeData.setStoreDataValue(
          keyStoreData.typeCall,
          typeCallEnum.outgoingCall,
        );
        let termSDT = soDienThoai;
        setSoDienThoai('');
        console.log(
          'Dữ liệu truyền sang màn hình cuộc gọi: ',
          termSDT,
          termHoTen,
          typeCallEnum.outgoingCall,
        );
        navigation.navigate('CuocGoi');
      } else {
        logData.writeLogData('[Call Internet Error. Show Toast]');
        Toast.showWithGravity(
          'Mất kết nối Internet. Vui lòng kiểm tra lại đường truyền.',
          Toast.LONG,
          Toast.BOTTOM,
        );
      }
    });
  };

  const cuocGoiDiDanhBa = async sodanhba => {
    if (sodanhba.length < 3) {
      alert('Số điện thoại không đúng định dạng');
      return;
    } else if (sodanhba.length > 9) {
      let quyengoiSDT = await storeData.getStoreDataValue(
        keyStoreData.quyenGoiRa,
      );
      if (quyengoiSDT != '1') {
        alert('Bạn không có quyền gọi ra');
        return;
      }
    }

    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        let termHoTen = sodanhba;
        db.transaction(tx => {
          tx.executeSql(
            'SELECT * FROM DanhBa WHERE so_dien_thoai = ?',
            [sodanhba],
            (tx, {rows}) => {
              console.log('getHoTenTheoSoDienThoai', rows);
              if (rows.length > 0) {
                termHoTen = rows.item(0).ho_ten;
              }
            },
            (tx, error) => {
              console.log('Error check tên số điện thoại ', error);
            },
          );
        });
        storeData.setStoreDataValue(keyStoreData.soDienThoaiDi, sodanhba);
        storeData.setStoreDataValue(keyStoreData.hoTenDienThoaiDi, termHoTen);
        storeData.setStoreDataValue(
          keyStoreData.typeCall,
          typeCallEnum.outgoingCall,
        );
        let termSDT = sodanhba;
        setSoDienThoai('');
        console.log(
          'Dữ liệu truyền sang màn hình cuộc gọi: ',
          termSDT,
          termHoTen,
          typeCallEnum.outgoingCall,
        );
        navigation.navigate('CuocGoi');
      } else {
        logData.writeLogData('[Call Internet Error. Show Toast]');
        Toast.showWithGravity(
          'Mất kết nối Internet. Vui lòng kiểm tra lại đường truyền.',
          Toast.LONG,
          Toast.BOTTOM,
        );
      }
    });
  };

  const handleKeypadPressed = value => {
    let tmp = soDienThoai;
    tmp = tmp + value.trim();
    setSoDienThoai(tmp);
    if (soDienThoai.length > 0) {
      db.transaction(tx => {
        tx.executeSql(
          "SELECT * FROM DanhBa WHERE so_dien_thoai LIKE '%" +
            tmp +
            "%' ORDER BY ho_ten",
          [],
          (tx, {rows}) => {
            let temp = [];
            for (let i = 0; i < rows.length; i++) {
              temp.push(rows.item(i));
            }
            setListSearhDanhBa(temp);
          },
          tx => {
            console.log('Error list cuoc goi: ', tx);
          },
        );
      });
    }
  };

  const deleteNumber = () => {
    var tmp = soDienThoai;
    tmp = tmp.substr(0, tmp.length - 1);
    setSoDienThoai(tmp);
  };

  const keypadLongPressed = () => {
    setSoDienThoai('');
  };

  const copyOrFetch = async () => {
    let textCopy = await Clipboard.getString();
    if (textCopy.length > 0) {
      setSoDienThoai(textCopy);
      Clipboard.setString('');
    } else {
      if (soDienThoai.length > 0) {
        Clipboard.setString(soDienThoai.toString());
      }
    }
    setTip(false);
  };

  const showTipCopy = async () => {
    let textCopy = await Clipboard.getString();
    console.log('[textCopy]', textCopy);
    if (textCopy.length > 0) {
      setCopyOrParse('Paste');
      setTip(true);
    } else {
      setCopyOrParse('Copy');
      if (soDienThoai.length > 0) {
        setTip(true);
      }
    }
  };

  const getDanhSachNoiBo = async () => {
    let urlApiData = await storeData.getStoreDataValue(keyStoreData.urlApi);
    let idctData = await storeData.getStoreDataValue(keyStoreData.idct);
    let idnhanvienData = await storeData.getStoreDataValue(
      keyStoreData.idnhanvien,
    );

    setCheckDongBoDanhBa(true);

    let url = urlApiData + BaseURL.URL_LIST_PHONEBOOK_SYSTEM;
    let params = {
      idct: idctData,
      idnhanvien: idnhanvienData,
      token: '',
      lastID: 0,
    };
    AppApi.RequestPOST(url, params, (err, json) => {
      if (!err) {
        if (json.data.status) {
          var lisdanhba = json.data.dsdanhba;
          setListNoiBo(lisdanhba);
          setListNoiBoAll(lisdanhba);

          if (checkThemDanhBaHeThong !== 'true') {
            lisdanhba.map(item => {
              DanhBaDB.addDanhBa(
                item.tenlienhe,
                item.sodienthoai,
                item.tenlienhe.substring(0, 1),
                kieuDanhBa.HeThong,
              );
            });
            storeData.setStoreDataValue(
              keyStoreData.checkThemDanhBaHeThong,
              true,
            );
          }
        } else {
        }
      }
    });
    setCheckDongBoDanhBa(false);
  };

  const DongBoDanhBaDataBase = () => {
    if (IOS) {
      Contacts.checkPermission().then(permission => {
        console.log('check', permission);
        if (permission === 'undefined') {
          Contacts.requestPermission().then(per => {
            setCheckDongBoDanhBa(true);
            dongBoDanhBaHeThong.themDanhBa();
          });
        }
        if (permission === 'authorized') {
          setCheckDongBoDanhBa(true);
          dongBoDanhBaHeThong.themDanhBa();
        }
        if (permission === 'denied') {
          Alert.alert(
            'Thông báo',
            'Bạn chưa cho quyền cho danh bạ',
            [
              {
                text: 'Xác nhận',
                onPress: () => {
                  console.log('test', 'chua xin quen danh ba');
                },
                style: 'cancel',
              },
            ],
            {cancelable: false},
          );
        }
      });
    } else {
      PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_CONTACTS, {
        title: 'Contacts',
        message: 'This app would like to view your contacts.',
        buttonPositive: 'Please accept bare mortal',
      }).then(() => {
        setCheckDongBoDanhBa(true);
        dongBoDanhBaHeThong.themDanhBa();
      });
    }
    setCheckDongBoDanhBa(false);
  };

  //Xin quyền
  const requestPermissionsAndroid = () => {
    if (!IOS) {
      PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_CONTACTS, {
        title: 'Contacts',
        message: 'This app would like to view your contacts.',
        buttonPositive: 'Please accept bare mortal',
      }).then(() => {
        check_Permission.requestCallPhonePermission().then(() => {
          if (check_Permission.callPhone === false) {
            Alert.alert(
              'Thông báo',
              'Bạn chưa cấp quyền điện thoại ?',
              [
                {
                  text: 'Cấp quyền',
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
                  'Thông báo',
                  'Bạn chưa cấp quyền microphone ?',
                  [
                    {
                      text: 'Cấp quyền',
                      onPress: () => {
                        check_Permission.requestRecordAudioPermission();
                      },
                    },
                  ],
                  {cancelable: false},
                );
              } else {
                DeviceInfo.getApiLevel().then(apiLevel => {
                  storeData.getStoreDataValue('isResetApp').then(isResetApp => {
                    storeData.setStoreDataValue('isResetApp', true).then(() => {
                      if (isResetApp != 'true') {
                        logData.writeLogData('[ResetApp]');
                        RNRestart.Restart();
                      }
                    });
                  });

                  check_Permission
                    .requestReadPhoneStatePermission()
                    .then(() => {
                      if (check_Permission.readPhoneState === false) {
                        Alert.alert(
                          'Thông báo',
                          'Bạn chưa cấp quyền tài khoản cuộc gọi ?',
                          [
                            {
                              text: 'Cấp quyền',
                              onPress: () => {
                                check_Permission.requestReadPhoneStatePermission();
                              },
                            },
                          ],
                          {cancelable: false},
                        );
                      }
                    });
                });
              }
            });
          }
        });
      });
    }
  };

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      storeData.getStoreDataValue(keyStoreData.isLogin).then(isLogin => {
        console.log('[isLogin]', isLogin);
        if (isLogin === 'true') {
          console.log('yeu cau quyen truy cap');
          requestPermissionsAndroid();
        } else {
          navigation.navigate('Login');
        }
      });
    });

    return () => {
      unsubscribe;
    };
  }, [navigation]);

  useEffect(() => {
    DongBoDanhBaDataBase();
    getDanhSachNoiBo();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={{flex: 1}}>
        <View style={{alignItems: 'center', justifyContent: 'center'}}>
          <Tooltip
            isVisible={showTip}
            content={
              <TouchableOpacity onPress={copyOrFetch}>
                <Text> {copyOrParse} </Text>
              </TouchableOpacity>
            }
            onClose={() => setTip(false)}
            placement="bottom"
            // below is for the status bar of react navigation bar
            topAdjustment={0}>
            <TouchableOpacity
              style={[{width: 300, height: 40, marginTop: 10}, styles.button]}
              onPress={showTipCopy}>
              <Text style={{fontSize: 24, textAlign: 'center'}}>
                {soDienThoai}
              </Text>
            </TouchableOpacity>
          </Tooltip>
        </View>

        {soDienThoai.length > 0 ? (
          <FlatList
            style={styles.itemStyle}
            data={listSearhDanhBa || []}
            renderItem={({item, index}) => {
              return (
                <TouchableOpacity
                  onPress={() => {
                    cuocGoiDiDanhBa(item.so_dien_thoai);
                  }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      borderBottomColor: '#dfdfdf',
                      borderBottomWidth: 1,
                      paddingVertical: 4,
                      marginHorizontal: 15,
                    }}>
                    <Text style={styles.text_tenNguoiGoi}>{item.ho_ten}</Text>
                    <Text style={styles.text_soDienThoaiNguoiGoi}>
                      {item.so_dien_thoai}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
            keyExtractor={(item, index) => index.toString()}></FlatList>
        ) : (
          <Text></Text>
        )}
      </View>
      <View style={{flex: 4}}>
        <View style={styles.keypad}>
          <View style={styles.keypadrow}>
            <KeypadButton
              style={styles.keypadbutton}
              txt1="1"
              txt2=""
              onPress={() => handleKeypadPressed('1')}
            />
            <KeypadButton
              style={styles.keypadbutton}
              txt1="2"
              txt2="A B C"
              onPress={() => handleKeypadPressed('2')}
            />
            <KeypadButton
              styleCss={styles.keypadbutton}
              txt1="3"
              txt2="D E F"
              onPress={() => handleKeypadPressed('3')}
            />
          </View>
          <View style={styles.keypadrow}>
            <KeypadButton
              style={styles.keypadbutton}
              txt1="4"
              txt2="G H I"
              onPress={() => handleKeypadPressed('4')}
            />
            <KeypadButton
              style={styles.keypadbutton}
              txt1="5"
              txt2="J K L"
              onPress={() => handleKeypadPressed('5')}
            />
            <KeypadButton
              style={styles.keypadbutton}
              txt1="6"
              txt2="M N O"
              onPress={() => handleKeypadPressed('6')}
            />
          </View>
          <View style={styles.keypadrow}>
            <KeypadButton
              style={styles.keypadbutton}
              txt1="7"
              txt2="P Q R S"
              onPress={() => handleKeypadPressed('7')}
            />
            <KeypadButton
              style={styles.keypadbutton}
              txt1="8"
              txt2="T U V"
              onPress={() => handleKeypadPressed('8')}
            />
            <KeypadButton
              style={styles.keypadbutton}
              txt1="9"
              txt2="W X Y Z"
              onPress={() => handleKeypadPressed('9')}
            />
          </View>
          <View style={styles.keypadrow}>
            <KeypadButton
              style={styles.keypadbutton}
              txt1="*"
              txt2=""
              onPress={() => handleKeypadPressed('*')}
            />
            <KeypadButton
              style={styles.keypadbutton}
              txt1="0"
              txt2="+"
              onPress={() => handleKeypadPressed('0')}
            />
            <KeypadButton
              style={styles.keypadbutton}
              txt1="#"
              txt2=""
              onPress={() => handleKeypadPressed('#')}
            />
          </View>
        </View>
      </View>
      <View style={{flexDirection: 'row', alignSelf: 'center', flex: 1}}>
        {soDienThoai.length == 0 ? null : (
          <TouchableOpacity
            style={[styles.buttonCircle, styles.invisible]}></TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={cuocGoiDi}
          style={[styles.buttonCircle, styles.bgSuccess]}>
          <Ionicons name="ios-call" style={styles.btnSuccess} size={35} />
        </TouchableOpacity>
        {soDienThoai.length == 0 ? null : (
          <TouchableOpacity
            style={styles.buttonCircle}
            onPress={deleteNumber}
            onLongPress={keypadLongPressed}>
            <Ionicons
              name="backspace-outline"
              style={styles.btnbgDanger}
              size={40}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* {checkDongBoDanhBa == true && <ProgressApp />} */}
    </SafeAreaView>
  );
}

const DEVICE_WIDTH = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    flex: 1,
  },
  keypad: {
    marginTop: 0,
    marginBottom: 0,
  },
  keypadrow: {
    flexDirection: 'row',
    alignSelf: 'center',
  },
  keypadbutton: {
    margin: 10,
    width: DEVICE_WIDTH / 5,
    height: DEVICE_WIDTH / 5,
    borderWidth: 0,
    backgroundColor: '#F5F5F5',
    borderRadius: DEVICE_WIDTH / 10,
    paddingTop: 7,
  },
  itemStyle: {
    backgroundColor: '#fff',
    width: DEVICE_WIDTH,
  },
  text_tenNguoiGoi: {
    color: '#000000',
    textAlign: 'left',
    fontSize: 16,
  },
  text_soDienThoaiNguoiGoi: {
    color: '#808080',
    fontSize: 15,
    textAlign: 'right',
  },
  buttonCircle: {
    borderWidth: 0,
    margin: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: DEVICE_WIDTH / 5,
    height: DEVICE_WIDTH / 5,
    borderRadius: DEVICE_WIDTH / 10,
  },
  bgSuccess: {
    backgroundColor: '#22bb33',
  },
  btnSuccess: {
    color: '#fff',
  },
  btnbgDanger: {
    color: '#f57f17',
  },
  row: {
    flexDirection: 'row',
    alignSelf: 'center',
  },
  invisible: {
    borderColor: '#fff',
  },
  font10: {
    fontSize: 10,
  },
  rowv2: {
    flexDirection: 'row',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    marginLeft: 10,
    marginRight: 10,
  },
});

export default BanPhim;
