import React, { useState, useEffect } from 'react';
import {
  View,
  PermissionsAndroid,
  FlatList,
  StyleSheet,
  Dimensions,
  Platform,
  Image,
  Alert,
  TouchableOpacity,
  Text
} from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';
import { SearchBar } from 'react-native-elements';
import storeData from '../../hooks/storeData';
import Contacts from 'react-native-contacts';
import keyStoreData from '../../utils/keyStoreData';

const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;
const isIOS = Platform.OS === 'ios';

export default function tabBookTrenMay() {
  const [phoneBookList, setPhoneBookList] = useState([]);
  const [search, setSearch] = useState('');
  const [checkQuyenGoiRaNgoai, setCheckQuyenGoiRaNgoai] = useState('');

  useEffect(() => {
    requestReadContactsPermission();
  }, []);

  const requestReadContactsPermission = async () => {
    let quyengoiSDT = await storeData.getStoreDataValue(keyStoreData.quyenGoiRa);
    console.log('Quyền gọi ra ngoài: ', quyengoiSDT);
    setCheckQuyenGoiRaNgoai(quyengoiSDT);

    if (isIOS) {
      Contacts.checkPermission().then((permission) => {
        console.log('check', permission);

        if (permission === 'undefined') {
          Contacts.requestPermission().then((per) => {
            loadContacts();
          });
        }
        if (permission === 'authorized') {
          loadContacts();
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
            { cancelable: false },
          );
        }
      });
    } else {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('TTT', 'da xin quyen danh ba');
          loadContacts();
        } else {
          console.log('TTT', 'chua xin quen danh ba');
        }
      } catch (err) {
        console.warn(err);
      }
    }
  }

  const loadContacts = () => {
    Contacts.getAll().then((contacts) => {
      contacts.sort(
        (a, b) => (a.familyName + a.givenName).toLowerCase() > (b.familyName + b.givenName).toLowerCase(),
      );
      setPhoneBookList(contacts);

    });
  }


  const searchDanhBa = (text) => {
    setSearch(text);
    const phoneNumberRegex = /\b[\+]?[(]?[0-9]{2,6}[)]?[-\s\.]?[-\s\/\.0-9]{3,15}\b/m;
    const emailAddressRegex = /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i;
    if (text === '' || text === null) {
      loadContacts();
    } else if (phoneNumberRegex.test(text)) {
      Contacts.getContactsByPhoneNumber(text).then((contacts) => {
        setPhoneBookList(contacts);
      });
    } else if (emailAddressRegex.test(text)) {
      Contacts.getContactsByEmailAddress(text).then((contacts) => {
        setPhoneBookList(contacts);
      });
    } else {
      Contacts.getContactsMatchingString(text).then((contacts) => {
        setPhoneBookList(contacts);
      });
    }
  }

  const handleCuocGoiDi = async (sdt, hoten) => {
    if (checkQuyenGoiRaNgoai !== '1') {
      Alert.alert(
        'Thông báo ',
        'Bạn không có quyền gọi ra ,vui lòng liên hệ với quản trị viên !',
        [
          {
            text: 'Xác nhận',
            onPress: () => console.log('ok'),
            style: 'cancel',
          },
        ],
        { cancelable: false },
      );
    } else {
      setTimeout(() => {
        storeData.setStoreDataValue(keyStoreData.soDienThoaiDi, sdt);
        storeData.setStoreDataValue(keyStoreData.hoTenDienThoaiDi, hoten);
        storeData.setStoreDataValue(keyStoreData.typeCall, typeCallEnum.outgoingCall);
        navigation.navigate('CuocGoi');
      }, 200);
    }
  }


  return (
    <View style={styles.container}>
      <View>
        <SearchBar
          placeholder="Tìm kiếm"
          inputStyle={{ alignItems: 'center', color: '#000000' }}
          inputContainerStyle={{ alignItems: 'center' }}
          onChangeText={(text) => {
            searchDanhBa(text);
          }}
          value={search}
          inputContainerStyle={{
            backgroundColor: '#DDDDDD',
            borderRadius: 5,
            height: 40,
            opacity: 0.5,
          }}
          containerStyle={{
            backgroundColor: '#fff',
            borderTopColor: '#fff',
          }}
        />
      </View>

      <View style={{ flex: 1, marginTop: 5 }}>
        <FlatList
          keyExtractor={(item, index) => index.toString()}
          style={styles.itemStyle}
          data={phoneBookList || []}
          renderItem={({ item, index }) => {
            return (
              <TouchableOpacity
                style={{ flexDirection: 'row', justifyContent: 'space-around' }}
                onPress={() => {
                  if (isIOS) {
                    handleCuocGoiDi(item.phoneNumbers[0].number, item.familyName + " " + item.givenName)
                  }
                  else {
                    handleCuocGoiDi(item.phoneNumbers[0].number, item.displayName)
                  }
                }}>
                <View style={{ flex: 1, alignItems: 'center', marginHorizontal: 7, marginVertical: 5 }}>
                  <Image
                    source={require('../../Toda_Images/contactsV2.png')}
                    style={{ width: 35, height: 35, tintColor: '#1976d2', marginTop: 10, }}
                  />
                </View>
                <View style={{
                  flex: 9, alignItems: 'flex-start', alignContent: 'flex-start', borderBottomColor: '#dfdfdf',
                  borderBottomWidth: 1, paddingVertical: 5, flexDirection: 'row', justifyContent: 'space-between'
                }}>
                  <View style={{ flex: 9 }}>
                    {isIOS ? (
                      <Text style={styles.text_tenNguoiGoi}>
                        {item.familyName + " " + item.givenName}
                      </Text>
                    ) : (
                      <Text style={styles.text_tenNguoiGoi}>
                        {item.displayName}
                      </Text>
                    )}
                    {item.phoneNumbers.length == 0 ? (
                      <Text style={styles.text_SDTNguoiGoi}>
                        không lấy đc số điện thoại
                      </Text>
                    ) : (
                      <Text style={styles.text_SDTNguoiGoi}>
                        {item.phoneNumbers[0].number}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={{ flex: 1, alignContent: 'center', alignItems: 'center', marginRight: 5 }}
                    onPress={() => Contacts.openExistingContact(item)}>
                    <Ionicons
                      name="information-circle-outline"
                      style={{
                        color: '#5c9fff',
                        marginTop: 10,
                        marginRight: 10,
                        fontSize: 23,
                      }}
                    />
                  </TouchableOpacity>
                </View>

              </TouchableOpacity>
            );
          }}

        />
      </View>
    </View>
  );

}

var styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    flex: 1,
  },
  searchBar: {
    backgroundColor: '#f0eded',
    paddingHorizontal: 30,
    paddingVertical: Platform.OS === 'android' ? undefined : 15,
  },
  tieude: {
    backgroundColor: '#5c9fff',
    width: DEVICE_WIDTH,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text_tieude: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },

  itemStyle: {
    backgroundColor: '#ffffff',
  },

  text_tenNguoiGoi: {
    color: '#000000',
    marginLeft: 3,
    fontSize: 17,
    textAlign: 'left',
  },
  text_SDTNguoiGoi: {
    color: '#808080',
    marginLeft: 3,
    fontSize: 16,
    marginTop: 5,
    textAlign: 'left',
  },
  text_thoiGian: {
    color: '#808080',
    marginLeft: 20,
    marginTop: 5,
    fontSize: 14,
  },

  view_gachNgang: {
    backgroundColor: '#A9A9A9',
    marginRight: 10,
    marginLeft: 10,
    marginTop: 5,
    height: 0.5,
  },
});
