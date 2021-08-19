import React, { useState, useEffect } from 'react';
import {
    Text,
    View,
    SafeAreaView,
    FlatList,
    Alert,
    StyleSheet,
    Dimensions,
    Image,
    TouchableOpacity,
} from 'react-native';
import IconFeather from 'react-native-vector-icons/Feather';
import { openDatabase } from 'react-native-sqlite-storage';
import Swipeout from 'react-native-swipeout';
import storeData from '../../hooks/storeData';
import CallTypeEnum from '../../hubmanager/CallTypeEnum';
import moment from 'moment';
import CuocgoiDB from '../../database/CuocGoiDB';
import keyStoreData from '../../utils/keyStoreData';
import typeCallEnum from '../../utils/typeCallEnum';

var db = openDatabase({ name: 'UserDatabase.db' });

const widthScreen = Dimensions.get('window').width;

export default function LichSuCuocGoi({ navigation, route }) {

    const [listCuocGoi, setListCuocGoi] = useState([]);
    const [listDataCuocGoiNho, setListCuocGoiNho] = useState([]);
    const [prefix, setPrefix] = useState('');
    const [type, setType] = useState(0);

    const getCurrentDate = () => {
        var date = new Date().getDate();
        var month = new Date().getMonth() + 1;
        var year = new Date().getFullYear();
        return date + '/' + month + '/' + year; //format: dd-mm-yyyy;
    }
    const getNgayHomQua = () => {
        var date = new Date().getDate() - 1;
        var month = new Date().getMonth() + 1;
        var year = new Date().getFullYear();
        return date + '/' + month + '/' + year; //format: dd-mm-yyyy;
    }

    React.useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            //do something
            loadDataHistory();
        });

        return unsubscribe;
    }, [navigation]);

    const loadDataHistory = async () => {
        let prefixData = await storeData.getStoreDataValue('Prefix');
        setPrefix(prefixData);
        var db = openDatabase({ name: 'UserDatabase.db' });
        db.transaction((tx) => {
            tx.executeSql('SELECT * FROM CuocGoi WHERE kieu_cuoc_goi = ? or kieu_cuoc_goi = ? or kieu_cuoc_goi = ?  ORDER BY ngay_goi DESC', [CallTypeEnum.IncomingCall, CallTypeEnum.OutboundCall, CallTypeEnum.MissingCall],
                (tx, { rows }) => {
                    let temp = [];
                    for (let i = 0; i < rows.length; i++) {
                        temp.push(rows.item(i));
                    }

                    setListCuocGoi(temp);
                },
                (tx, error) => {
                    console.log('Error list cuoc goi: ', error);
                }
            );
            tx.executeSql('SELECT * FROM CuocGoi WHERE kieu_cuoc_goi = ? ORDER BY ngay_goi DESC', [CallTypeEnum.MissingCall],
                (tx, { rows }) => {
                    console.log('cuoc goi nho', rows);
                    let temp = [];
                    for (let i = 0; i < rows.length; i++) {
                        temp.push(rows.item(i));
                    }

                    setListCuocGoiNho(temp);
                },
                (tx, error) => {
                    console.log('Error list cuoc goi nhỡ: ', error);
                }
            );
        });
    }

    const removeHistory = (id_cuoc_goi) => {
        let temp = listCuocGoi;
        temp = temp.filter(a => a.id_cuoc_goi !== id_cuoc_goi);
        setListCuocGoi(temp);
        let tempGoiNho = listDataCuocGoiNho;
        tempGoiNho = tempGoiNho.filter(a => a.id_cuoc_goi !== id_cuoc_goi);
        setListCuocGoiNho(tempGoiNho);

        CuocgoiDB.deleteCuocGoi(id_cuoc_goi);
    }


    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', paddingTop: 10, backgroundColor: "#fff" }}>
                <TouchableOpacity style={{ flex: 1, alignItems: 'center' }}
                    onPress={() => {
                        setType(0);
                    }}>
                    <Text
                        style={{
                            color: type == 0 ? '#1976d2' : '#000',
                            fontWeight: type == 0 ? '600' : 'normal',
                            paddingBottom: 10,
                        }}>TẤT CẢ</Text>

                    <View style={{
                        width: '100%', height: 5,
                        backgroundColor: type == 0 ? '#1976d2' : '#fff',
                    }} >

                    </View>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, alignItems: 'center' }}
                    onPress={() => {
                        setType(1);
                    }}>
                    <Text
                        style={{
                            color: type == 1 ? '#1976d2' : '#000',
                            fontWeight: type == 1 ? 'bold' : 'normal',
                            paddingBottom: 10,
                        }}>GỌI NHỠ</Text>
                    <View
                        style={{
                            width: '100%',
                            height: 5,
                            backgroundColor: type == 1 ? '#1976d2' : '#fff',
                        }} ></View>

                </TouchableOpacity>
            </View>

            <View style={styles.container}>
                <View style={{ flex: 1 }}>
                    <View style={styles.container}>
                        <FlatList
                            style={styles.itemStyle}
                            data={(type == 0 ? listCuocGoi : listDataCuocGoiNho) || []}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={({ item }) => {
                                return (
                                    <Swipeout
                                        right={[
                                            {
                                                component: (
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
                                                ),
                                                onPress: () => {
                                                    Alert.alert(
                                                        'Thông báo',
                                                        'Bạn có chắc chắn xóa lịch sử ?',
                                                        [
                                                            {
                                                                text: 'Thoát',
                                                                onPress: () => console.log('Cancel Pressed'),
                                                                style: 'cancel',
                                                            },
                                                            {
                                                                text: 'Đồng ý',
                                                                onPress: () => { removeHistory(item.id_cuoc_goi) }
                                                            },
                                                        ],
                                                        { cancelable: false },
                                                    );
                                                },
                                                backgroundColor: 'rgb(217, 80, 64)',
                                            },
                                        ]}
                                        autoClose={true}
                                        style={styles.itemStyle}
                                    >

                                        <TouchableOpacity
                                            onPress={() => {
                                                if (item.so_dien_thoai != "" && item.so_dien_thoai != null) {
                                                    setTimeout(() => {
                                                        storeData.setStoreDataValue(keyStoreData.soDienThoaiDi, item.so_dien_thoai);
                                                        storeData.setStoreDataValue(keyStoreData.hoTenDienThoaiDi, item.ho_ten);
                                                        storeData.setStoreDataValue(keyStoreData.typeCall, typeCallEnum.outgoingCall);
                                                        navigation.navigate('CuocGoi')
                                                    }, 200);
                                                }
                                            }}
                                            style={{ flexDirection: 'row', flex: 1, alignItems: 'center', justifyContent: 'space-between', margin: 8 }}
                                        >
                                            <View
                                                style={{ alignItems: 'center', alignContent: 'center', margin: 10, flex: 1, }}
                                            >

                                                {item.kieu_cuoc_goi == CallTypeEnum.MissingCall ? (
                                                    <IconFeather
                                                        name="phone-missed"
                                                        style={{
                                                            alignItems: 'center',
                                                            color: '#EE0000',
                                                            fontSize: 22,
                                                            width: 26,
                                                            height: 30,
                                                        }}
                                                    />
                                                ) : item.kieu_cuoc_goi == CallTypeEnum.IncomingCall ? (
                                                    <IconFeather

                                                        name="phone-incoming"
                                                        style={{
                                                            alignItems: 'center',
                                                            color: '#006699',
                                                            fontSize: 22,
                                                            width: 26,
                                                            height: 30,
                                                        }}
                                                    />
                                                ) : (
                                                    <IconFeather

                                                        name="phone-forwarded"
                                                        style={{
                                                            alignItems: 'center',
                                                            color: '#1976d2',
                                                            fontSize: 22,
                                                            width: 26,
                                                            height: 30,
                                                        }}
                                                    />
                                                )}
                                            </View>
                                            <View
                                                style={{
                                                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
                                                    , borderBottomColor: '#dfdfdf', borderBottomWidth: 1, flex: 9,
                                                }}
                                            >


                                                <View style={{ marginHorizontal: 3, alignSelf: 'flex-end', alignContent: 'flex-start' }}>
                                                    <View style={{ flexDirection: 'row' }}>
                                                        <Text style={styles.text_tenNguoiGoi}>
                                                            {item.ho_ten}
                                                        </Text>

                                                        {
                                                            item.so_lan_goi > 1 ?
                                                                (<Text style={{ fontSize: 15 }}>({item.so_lan_goi})</Text>) : (<></>)
                                                        }

                                                    </View>
                                                    <Text style={styles.text_SDTNguoiGoi}>
                                                        {item.so_dien_thoai}
                                                    </Text>
                                                </View>


                                                <View
                                                    style={{
                                                        flexDirection: 'row',
                                                        alignSelf: 'center',
                                                        marginRight: 10,
                                                    }}>

                                                    {moment(item.ngay_goi).format('D/M/YYYY') === getCurrentDate() ? (
                                                        <Text style={styles.text_thoiGian}>
                                                            {moment(item.ngay_goi).format('HH:mm')}
                                                        </Text>
                                                    ) : moment(item.ngay_goi).format('D/M/YYYY') === getNgayHomQua() ? (
                                                        <Text style={styles.text_thoiGian}>
                                                            Hôm qua
                                                        </Text>
                                                    ) : (
                                                        <Text style={styles.text_thoiGian}>
                                                            {moment(new Date(item.ngay_goi)).format('D/M/YYYY')}
                                                        </Text>
                                                    )}
                                                    <TouchableOpacity
                                                        style={{ alignItems: 'center' }}
                                                        onPress={() => {
                                                            if (item.so_dien_thoai != "" && item.so_dien_thoai != null) {
                                                                console.log('item: on Press: ', item);
                                                                navigation.navigate(
                                                                    'ChiTietLichSuCuocGoi',
                                                                    {
                                                                        id_cuoc_goi: item.id_cuoc_goi,
                                                                        so_dien_thoai: item.so_dien_thoai,
                                                                        ho_ten: item.ho_ten,
                                                                        anh_dai_dien: item.anh_dai_dien,

                                                                    }
                                                                );
                                                            }


                                                        }}>
                                                        <IconFeather
                                                            name="info"
                                                            style={{
                                                                color: '#5c9fff',
                                                                fontSize: 23,
                                                                marginLeft: 15,
                                                            }}
                                                        />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>


                                        </TouchableOpacity>
                                    </Swipeout>
                                );
                            }}
                        />
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );

}

var styles = StyleSheet.create({
    container: {
        backgroundColor: '#ffffff',
        flex: 1,
    },
    tieude: {
        backgroundColor: '#1976d2',
        width: widthScreen,
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
        width: widthScreen,
    },

    text_tenNguoiGoi: {
        color: '#000000',
        marginBottom: 3,
        fontSize: 18,
        fontWeight: '600',
        marginRight: 5,
    },
    text_SDTNguoiGoi: {
        color: '#808080',
        marginBottom: 4,
        fontSize: 16,
    },
    text_thoiGian: {
        color: '#808080',
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