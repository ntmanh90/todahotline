import React, { useState, useEffect } from 'react';
import AppApi from '../../api/Client';
import storeData from '../../hooks/storeData';
import keyStoreData from '../../utils/keyStoreData';
import BaseURL from '../../utils/BaseURL';
import { SpeedDial } from 'react-native-elements';
import { FAB, Icon } from 'react-native-elements';
import colors from '../../theme/colors';

import {
  View,
  FlatList,
  StyleSheet,
  Alert,
  Dimensions,
  Text,
  TouchableOpacity,
  Image
} from 'react-native';
import Swipeout from 'react-native-swipeout';
import { useNavigation } from '@react-navigation/native';

import { SearchBar } from 'react-native-elements';
import ProgressApp from '../../components/ProgressApp';
import Toast from 'react-native-simple-toast';
import DanhBaDB from '../../database/DanhBaDB';
import kieuDanhBa from '../../utils/kieuDanhBa';

const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;


export default function tabBookHeThong() {
  const [listNoiBo, setListNoiBo] = useState([]);
  const [listNoiBoAll, setListNoiBoAll] = useState([]);
  const [showProcess, setShowProcess] = useState(false);
  const [search, setSearch] = useState('');

  const navigation = useNavigation();

  useEffect(() => {
    getDanhSachNoiBo();
  }, []);

  const removeContact = async (item, index) => {
    console.log("dataRemove: ", item)
    let urlApi = await storeData.setStoreDataValue(keyStoreData.urlApi);
    let idctData = await storeData.setStoreDataValue(keyStoreData.idct);
    let idnhanvienData = await storeData.setStoreDataValue(keyStoreData.idnhanvien);
    var url = urlApi + BaseURL.URL_DEL_CONTACT;
    var data = [item.iddanhba]
    var params = {
      idct: idctData,
      idnhanvien: idnhanvienData,
      dulieudanhba: JSON.stringify(data),
    };
    setShowProcess(false);

    AppApi.RequestPOST(url, params, '', (err, json) => {
      setShowProcess(false);

      if (!err) {
        console.log(json.data.status)
        if (json.data.status) {
          getDanhSachNoiBo()
        } else {
          Toast.showWithGravity('Xoá dữ liệu thất bại.', Toast.LONG, Toast.TOP);
        }
      } else {
        Toast.showWithGravity('Vui lòng kiểm tra lại internet !!!', Toast.LONG, Toast.TOP);
      }

    })
  }



  const renderProcess = () => {
    if (showProcess) {
      return (
        <ProgressApp />
      );
    } else {
      return null;
    }
  }

  const searchDanhBa = (text) => {
    setSearch(text);
    var ttt = text.toLowerCase();
    var listTest = listNoiBoAll;
    const newData = listTest.filter((item) => {
      const itemData = `${item.tenlienhe.toUpperCase()}   
      ${item.sodienthoai.toUpperCase()} ${item.chucvu.toUpperCase()}`;
      const textData = ttt.toUpperCase();

      return itemData.indexOf(textData) > -1;
    });
    if (!text || text === '') {
      getDanhSachNoiBo();
    }
    setListNoiBo(newData);
  }



  return (
    <View style={{ flex: 1, }}>
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
              borderRadius: 10,
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
            data={listNoiBo || []}
            renderItem={({ item, index }) => {
              return (
                <Swipeout
                  right={[
                    {
                      component:
                        <View
                          style={{
                            flex: 1,
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                          }}>
                          <Image
                            source={require('../../Toda_Images/delete.png')}
                            style={{ width: 20, height: 30 }}
                          />
                        </View>
                      ,
                      onPress: () => {
                        Alert.alert(
                          'Thông báo',
                          'Bạn có chắc chắn xóa liên hệ ?',
                          [
                            {
                              text: 'Thoát',
                              onPress: () => console.log('Cancel Pressed'),
                              style: 'cancel',
                            },
                            {
                              text: 'Đồng ý',
                              onPress: () => {
                                removeContact(item, index)
                              }
                            },
                          ],
                          { cancelable: false },
                        );
                      },
                      backgroundColor: 'rgb(217, 80, 64)',
                    },
                  ]}
                  autoClose={true}
                  style={styles.itemStyle}>

                  <TouchableOpacity
                    style={{ flexDirection: 'row', justifyContent: 'space-around' }}
                    onPress={() => cuocGoiDi(item.sodienthoai)}>
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
                      <View>
                        <Text style={styles.text_tenNguoiGoi}>
                          {item.tenlienhe}
                        </Text>
                        <Text style={styles.text_SDTNguoiGoi}>
                          {item.sodienthoai}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 13, color: '#5c9fff', alignItems: 'center', marginTop: 13, marginRight: 10 }}>
                        {item.chucvu}
                      </Text>
                    </View>

                  </TouchableOpacity>
                </Swipeout>

              );
            }}

          />
        </View>
        {renderProcess()}
      </View>
      <FAB
        icon={
          <Icon
            name="add"
            size={25}
            color="white"
            style={{ fontWeight: 'bold' }}
          />
        }
        placement="right" color={colors.mauChuHighlight} size="small"
        onPress={() => { navigation.navigate('addListPhoneBook') }}
      />
    </View>
  );

}


var styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    flex: 1,
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
    width: DEVICE_WIDTH,
  },

  text_tenNguoiGoi: {
    color: '#000000',
    marginLeft: 3,
    fontSize: 17,
  },
  text_SDTNguoiGoi: {
    color: '#808080',
    marginLeft: 3,
    marginTop: 5,
    fontSize: 16,
  },
  text_thoiGian: {
    color: '#808080',
    marginLeft: 20,
    marginTop: 5,
    fontSize: 14,
  },
});
