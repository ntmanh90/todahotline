import React, { useState, useEffect } from 'react';
import storeData from '../../hooks/storeData';
import keyStoreData from '../../utils/keyStoreData';

import {
  View,
  FlatList,
  StyleSheet,
  Alert,
  Dimensions,
  Text,
  TouchableOpacity,
  Image,
  TextInput
} from 'react-native';
import Swipeout from 'react-native-swipeout';
import { openDatabase } from 'react-native-sqlite-storage';
import { Overlay, SearchBar } from 'react-native-elements';
import ProgressApp from '../../components/ProgressApp';
import KieuDanhBa from '../../utils/kieuDanhBa';

const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;



export default function tabBookKhachHang() {
  const [l, setListNoiBo] = useState([]);
  const [showProcess, setShowProcess] = useState(false);
  const [listNoiBoAll, setListNoiBoAll] = useState([]);
  const [search, setSearch] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [itemEdit, setItemEdit] = useState({});
  const [isAdd, setIsAdd] = useState(false);
  const [checkQuyenGoiRaNgoai, setCheckQuyenGoiRaNgoai] = useState(1);

  let listContact = [];

  useEffect(() => {
    loadDataContact();
  }, []);


  const loadDataContact = async () => {
    let quyengoiSDT = await storeData.getStoreDataValue(keyStoreData.quyenGoiRa);
    console.log('test quyen', quyengoiSDT);
    setCheckQuyenGoiRaNgoai(quyengoiSDT);

    var db = openDatabase({ name: 'UserDatabase.db' });
    db.transaction((tx) => {
      tx.executeSql('SELECT * FROM DanhBa WHERE kieu_danh_ba=?', [KieuDanhBa.KhachHang], (tx, { rows }) => {
        var temp = [];
        for (let i = 0; i < rows.length; ++i) {
          temp.push(rows.item(i));
        }

        setListNoiBo(temp);
        setListNoiBoAll(temp);
      });
    });
  }

  const removeContact = (item, index) => {
    loadDataContact()
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
    if (text === '') {
      this.setState({ listNoiBo: listTest });
    } else {
      var ttt = text.toLowerCase();
      var listTest = listContact;
      const newData = listTest.filter((item) => {
        const itemData = `${item.contact_phone.toUpperCase()} ${item.contact_name.toUpperCase()}`;
        const textData = ttt.toUpperCase();

        return itemData.indexOf(textData) > -1;
      });
      setListNoiBo(newData);
    }
  }


  return (
    <View style={{ flex: 1 }}>
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
        <View style={{ flex: 1 }}>
          <FlatList
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
                                this.removeContact(item, index)
                              }
                            },
                          ],
                          { cancelable: false },
                        );
                      },
                      backgroundColor: '#D95040',
                    },
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
                            source={require('../../Toda_Images/edit.png')}
                            style={{ width: 20, height: 30 }}
                          />
                        </View>
                      ,
                      onPress: () => {
                        setIsAdd(false);
                        setIsVisible(true);
                        setContactName(item.contact_name);
                        setContactPhone(item.contact_phone);
                        setItemEdit(item);
                      },
                      backgroundColor: '#D95',
                    },
                  ]}
                  autoClose={true}
                  style={styles.itemStyle}>
                  <Content>
                    <List>
                      <ListItem avatar onPress={() => {
                        storeData.getStoreDataValue('quyenGoiRa').then((quyenGoiRa) => {
                          if (quyenGoiRa == 0) {
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
                            if (item.phoneNumbers.length > 0) {
                              navigation.navigate('CuocGoi', { soDienThoai: item.contact_phone, type: 2 })

                            }

                          }
                        })
                      }}>
                        <Left>
                          <Image
                            source={require('../../Toda_Images/contactsV2.png')}
                            style={{ width: 35, height: 35, tintColor: "#1976d2" }}
                          />
                        </Left>
                        <Body>
                          <Text style={styles.text_tenNguoiGoi}>
                            {item.contact_name}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.text_SDTNguoiGoi}>
                              {item.contact_phone}
                            </Text>
                          </View>

                        </Body>
                        <Right>

                        </Right>
                      </ListItem>
                    </List>
                  </Content>
                </Swipeout>

              );
            }}
            keyExtractor={(item, index) => index.toString()}></FlatList>
        </View>
        {this.renderProcess()}
      </View>
      <Fab
        direction="up"
        style={{ backgroundColor: '#1976d2' }}
        position="bottomRight"
        onPress={() => {
          this.setState({ isVisible: true, isAdd: true })
        }}>
        <Icon name="playlist-add" type="MaterialIcons" />
      </Fab>
      <Overlay isVisible={isVisible} onBackdropPress={() => {
        setIsVisible(false);
        setContactName('');
        setContactPhone('');

      }}>
        <View style={{ justifyContent: 'center', width: DEVICE_WIDTH - 60 }}>
          <Text style={{ fontSize: 18, color: '#1976d2', fontWeight: 'bold', marginTop: 5 }}>{this.state.isAdd ? "Thêm liên hệ" : "Sửa liên hệ"}</Text>
          <TextInput style={{ borderRadius: 5, minHeight: 40, borderWidth: 0.5, padding: 5, marginTop: 15 }}
            placeholder={"Nhập họ tên"}
            value={contactName}
            onChangeText={(text) => {
              setContactName(text);
            }}></TextInput>
          <TextInput keyboardType={'phone-pad'}
            style={{ borderRadius: 5, minHeight: 40, borderWidth: 0.5, padding: 5, marginTop: 10 }}
            placeholder={"Nhập số điện thoại"}
            value={contactPhone}
            onChangeText={(text) => {
              setContactPhone(text);
            }}></TextInput>
          <TouchableOpacity onPress={() => {
            if (contactName == "") {
              Alert.alert("Lỗi!", "Vui lòng họ tên")
              return
            }
            if (contactPhone == "") {
              Alert.alert("Lỗi!", "Vui lòng số điện thoại")
              return
            }
            if (isAdd) {
              //addContact(this.state.contactName, this.state.contactPhone, 4)
              //them contact

            } else {
              ///this.props.contactManager.updateContact(this.state.itemEdit.contact_id, this.state.contactName, this.state.contactPhone)
              //update contact
            }
            setIsVisible(false);
            setContactName('');
            setContactPhone('');


            loadDataContact();
          }} style={styles.buttonConfirm2}>
            <Text style={styles.textConfirm}>Lưu</Text>
          </TouchableOpacity>
        </View>
      </Overlay>
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
    marginLeft: 10,
    fontSize: 17,
  },
  text_SDTNguoiGoi: {
    color: '#808080',
    marginLeft: 20,
    marginTop: 5,
    fontSize: 16,
  },
  text_thoiGian: {
    color: '#808080',
    marginLeft: 20,
    marginTop: 5,
    fontSize: 14,
  },
  buttonConfirm2: {
    minHeight: 45,
    minWidth: 100,
    marginTop: 15,
    marginBottom: 5,
    borderRadius: 25,
    backgroundColor: '#1976d2',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    padding: 10,
  },
  textConfirm: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
