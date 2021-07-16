import React, { useState, useEffect } from 'react';
import AppApi from '../../api/Client';
import storeData from '../../hooks/storeData';
import keyStoreData from '../../utils/keyStoreData';
import BaseURL from '../../utils/BaseURL';
import { CheckBox, SearchBar, Icon } from 'react-native-elements';

import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import ProgressApp from '../../components/ProgressApp';
import NetInfo from '@react-native-community/netinfo';
import Toast from 'react-native-simple-toast';
import DanhBaDB from '../../database/DanhBaDB';
import KieuDanhBa from '../../utils/kieuDanhBa';


const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;

export default function addListPhoneBook({ navigation }) {
  const [showProcess, setShowProcess] = useState(false);
  const [listPhoneBookFilter, setListPhoneBookFilter] = useState([]);
  const [listPhoneBook, setListPhoneBook] = useState([]);
  const [listCheck, setListCheck] = useState([]);
  const [checkAll, setCheckAll] = useState(false);
  const [search, setSearch] = useState('')

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      //do something
      getDataListAdd();
    });

    return unsubscribe;
  }, [navigation]);

  const getDataListAdd = async () => {

    let urlApiData = await storeData.getStoreDataValue(keyStoreData.urlApi);
    let idctData = await storeData.getStoreDataValue(keyStoreData.idct);
    let idnhanvienData = await storeData.getStoreDataValue(keyStoreData.idnhanvien);

    var url = urlApiData + BaseURL.URL_LIST_ADD_PHONBOOK;
    var params = {
      idct: idctData,
      idnhanvien: idnhanvienData,
    };
    AppApi.RequestPOST(url, params, (err, json) => {
      if (!err) {
        if (json.data.status) {
          var lisdanhba = json.data.dsdanhba;
          let term = [];
          console.log('respon -> ', json.data.dsdanhba);
          lisdanhba.map((item) => {
            item.isChoose = false;
            term.push(item);
          });
          console.log('term -> ', term);
          setListPhoneBook(term);
          setListPhoneBookFilter(term);
        } else {
          Toast.showWithGravity('Không lấy được danh sách.', Toast.LONG, Toast.TOP);
        }
      } else {
        Toast.showWithGravity('Vui lòng kiểm tra lại internet !!!', Toast.LONG, Toast.TOP);
      }
    });
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

  const isCheckAll = () => {
    var checkListAll = new Array();
    let listAll = listPhoneBook;

    if (!checkAll == true) {
      for (let i = 0; i < listAll.length; ++i) {
        listAll[i].isChoose = false;
        if (listAll[i].isChoose == false) {
          listAll[i].isChoose = !listAll[i].isChoose;
          if (listAll[i].isChoose) {
            checkListAll.push(listAll[i]);
          }
        }
      }
    } else {
      for (let i = 0; i < listAll.length; ++i) {
        if (listAll[i].isChoose == true) {
          listAll[i].isChoose = !listAll[i].isChoose;
          if (listAll[i].isChoose) {
            checkListAll.push(listAll[i]);
          }
        }
      }
    }

    setCheckAll(!checkAll);
    setListCheck(checkListAll);
    console.log('listCheck -> ', String(checkListAll.length));
  }

  const isCheckItem = (index) => {
    console.log('index', index);
    var listFilter = listPhoneBookFilter
    listFilter[index].isChoose = !listFilter[index].isChoose;
    setListPhoneBookFilter(listFilter)

    if (checkAll) {
      setCheckAll(!checkAll);
    }
    let list = listPhoneBook;
    for (let i = 0; i < list.length; i++) {
      if (listFilter[index].idrow == list[i].idrow) {
        list[i].isChoose = listFilter[index].isChoose;
        break
      }
    }

    setListPhoneBook(list);

    var checkList = new Array();
    for (let i = 0; i < list.length; ++i) {
      if (list[i].isChoose) {
        checkList.push(list[i]);
        console.log('objCheck -> ', list[i]);
      }
    }
    setListCheck(checkList);
    console.log('listCheck -> ', String(checkList.length));
  };

  const searchDanhBa = (text) => {
    setSearch(text);
    var listTerm = listPhoneBook;

    if (text === "") {
      setListPhoneBook(listPhoneBookFilter);
    } else {
      const newData = listTerm.filter((item) => {
        const itemData = `${item.tennhanvien.toUpperCase()}   
        ${item.sodienthoai.toUpperCase()} ${item.chucvu.toUpperCase()}`;

        return itemData.indexOf(text.toUpperCase()) > -1;
      });
      setListPhoneBook(newData);
    }

  }
  const addPhoneBook = async () => {
    let urlApiData = await storeData.getStoreDataValue(keyStoreData.urlApi);
    let idctData = await storeData.getStoreDataValue(keyStoreData.idct);
    let idnhanvienData = await storeData.getStoreDataValue(keyStoreData.idnhanvien);

    var data = JSON.stringify(listCheck);
    var url = urlApiData + BaseURL.URL_ADD_PHONEBOOK;
    var params = {
      idct: idctData,
      idnhanvien: idnhanvienData,
      token: '',
      dulieudanhba: data,
    };
    AppApi.RequestPOST(url, params, (err, json) => {
      if (!err) {
        setShowProcess(false);
        if (json.data.status) {
          listCheck.map((item) => {
            DanhBaDB.addDanhBa(item.tennhanvien, item.sodienthoai, item.tennhanvien.substring(0, 1), KieuDanhBa.HeThong);
          });

          navigation.goBack();
        } else {
          Toast.showWithGravity('Thêm dữ liệu thất bại.', Toast.LONG, Toast.TOP);
        }
      } else {
        Toast.showWithGravity('Vui lòng kiểm tra lại internet !!!', Toast.LONG, Toast.TOP);
      }
      setShowProcess(false);
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tieude}>
        <TouchableOpacity onPress={() => { navigation.goBack() }} style={{ marginLeft: 10 }}>
          <Icon type="feather" name="arrow-left" size={24} color={"#fff"} />
        </TouchableOpacity>
        <Text style={styles.text_tieude}>Thêm danh bạ</Text>
        <View style={{ width: 24, marginRight: 10 }}></View>
      </View>

      <View style={styles.container}>
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
        <View
          style={{
            marginTop: 10,
            marginLeft: 0,
            alignSelf: 'center',
            backgroundColor: 'transparent',
            justifyContent: 'center',
          }}>
          <CheckBox
            textStyle={{
              color: 'black',
              position: 'absolute',
              left: 15,
              top: -3,
              fontWeight: 'bold',
              fontSize: 20,
            }}
            checkedColor="#1976d2"
            uncheckedColor="#1976d2"
            title="Chọn tất cả"
            checked={checkAll}
            onPress={() => isCheckAll()}
            containerStyle={styles.checkBoxAll}
          />
        </View>

        <FlatList
          style={styles.itemStyle}
          data={listPhoneBook || []}
          renderItem={({ item, index }) => {
            return (

              <TouchableOpacity
                style={{ flexDirection: 'row', justifyContent: 'space-around' }}
              >
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
                  <View style={{ flex: 6, }}>
                    <Text style={styles.text_tenNguoiGoi}>
                      {item.tennhanvien}
                    </Text>
                    <Text style={styles.text_SDTNguoiGoi}>
                      {item.sodienthoai}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'center', alignContent: 'center', flex: 4 }}>
                    <CheckBox
                      checkedColor="#1976d2"
                      uncheckedColor="#1976d2"
                      checked={item.isChoose}
                      onPress={() => isCheckItem(index)}
                      containerStyle={styles.checkBox}
                    />
                    <Text style={{ fontSize: 13, color: '#5c9fff', alignItems: 'center', marginTop: 3, }} >
                      {item.chucvu}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          keyExtractor={(item, index) => index.toString()}></FlatList>

        <TouchableOpacity
          style={styles.bt_add}
          onPress={() => {
            if (listCheck.length == 0) {
              Alert.alert(
                'Thông báo ',
                'Bạn vui lòng chọn tối thiểu một số điện thoại',
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
              if (checkAll == true) {
                // console.log('load -> ', 'load reset');
                Alert.alert(
                  'Thông báo ',
                  'Bạn có chắc chắn muốn thêm tất cả không ?',
                  [
                    {
                      text: 'Hủy',
                      onPress: () => console.log('huy'),
                      style: 'cancel',
                    },
                    {
                      text: 'Đồng ý',
                      onPress: () => {
                        addPhoneBook();
                      },
                      style: 'default',
                    },
                  ],
                  { cancelable: false },
                );
              } else {
                addPhoneBook();
              }
            }
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon
              name="folder-add"
              type="foundation"
              size={32}
              color='#fff'
            />
            <Text style={styles.text_add}>Thêm vào danh bạ nội bộ</Text>
          </View>
        </TouchableOpacity>
      </View>
      {/* <Button iconLeft>
            <Icon name="folder-add" type="Foundation"/>
            <Text style={styles.text_add}>Thêm vào danh bạ nội bộ</Text>
          </Button> */}
      {renderProcess()}
    </SafeAreaView>
  );

}

var styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    flex: 1,
    width: DEVICE_WIDTH,
  },

  itemStyle: {
    backgroundColor: '#ffffff',
    marginTop: 5,
    width: DEVICE_WIDTH,
    flex: 1,
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
    marginBottom: 5,
    fontSize: 16,
  },
  text_thoiGian: {
    color: '#808080',
    marginLeft: 20,
    marginTop: 5,
    fontSize: 14,
  },
  tieude: {
    flexDirection: 'row',
    backgroundColor: '#1976d2',
    width: DEVICE_WIDTH,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text_tieude: {
    flex: 1,
    textAlign: 'center',
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  text_add: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },

  bt_add: {
    backgroundColor: '#1976d2',
    height: 45,
    alignItems: 'center',
    marginLeft: 45,
    marginRight: 45,
    marginBottom: 20,
    marginTop: 10,
    justifyContent: 'center',
    borderRadius: 10,
  },
  checkBox: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    alignSelf: 'center',
    padding: 0,
    marginRight: 10,
  },
  checkBoxAll: {
    backgroundColor: 'transparent',
    width: DEVICE_WIDTH - 20,
    borderColor: 'transparent',
    alignSelf: 'center',
  },
});
