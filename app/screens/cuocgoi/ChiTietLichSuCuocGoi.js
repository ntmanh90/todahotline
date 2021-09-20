import React, { useState, useEffect } from 'react';
import { Card, Icon } from 'react-native-elements';
import {
    FlatList,
    Image,
    ImageBackground,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
    Dimensions,
    TextInput,
    SafeAreaView,
    TouchableOpacity,
} from 'react-native';

import { Overlay } from 'react-native-elements';
import { openDatabase } from 'react-native-sqlite-storage';
const widthScreen = Dimensions.get('window').width;
import Clipboard from '@react-native-community/clipboard';
import Tooltip from 'react-native-walkthrough-tooltip';
import { Alert } from 'react-native';
import CallTypeEnum from '../../hubmanager/CallTypeEnum';

export default function ChiTietLichSuCuocGoi({ navigation, route }) {
    const [toolTipVisible, setToolTipVisible] = useState(false);
    const [listData, setListData] = useState([]);
    const [isAdd, setIsAdd] = useState(false);
    const [contactName, setContactName] = useState('');
    const [isVisible, setIsVisible] = useState(false);

    const [soDienThoai, setSoDienThoai] = useState('');
    const [hoTen, setHoTen] = useState('');
    const [anhDaiDien, setAnhDaiDien] = useState('');
    const [idCuocGoi, setIdCuocGoi] = useState(0);

    const getDataOnLoad = async () => {
        const { so_dien_thoai } = route.params;
        const { ho_ten } = route.params;
        const { anh_dai_dien } = route.params;
        const { id_cuoc_goi } = route.params;

        console.log('route.params: ', route.params);

        setSoDienThoai(so_dien_thoai);
        setHoTen(ho_ten);
        setAnhDaiDien(anh_dai_dien);
        setIdCuocGoi(id_cuoc_goi);

        //console.log('id_cuoc_goi', id_cuoc_goi);
        var db = openDatabase({ name: 'UserDatabase.db' });
        db.transaction((tx) => {
            tx.executeSql('SELECT * FROM ChiTietCuocGoi WHERE id_cuoc_goi = ? ORDER BY id_ct_cuoc_goi DESC', [id_cuoc_goi],
                (tx, { rows }) => {
                    let temp = [];
                    for (let i = 0; i < rows.length; i++) {
                        temp.push(rows.item(i));
                    }
                    setListData(temp);
                },
                (error) => {
                    console.log('SQLlite error add ChiTietCuocGoi: ', error);
                }
            );

        });
    }


    useEffect(() => {
        getDataOnLoad();
    }, [route.params]);

    const copy = () => {
        Clipboard.setString(soDienThoai);
        setToolTipVisible(false);
    };

    const renderHeader = () => {
        return (
            <View style={styles.headerContainer}>
                <ImageBackground
                    style={styles.headerBackgroundImage}
                    blurRadius={10}
                    source={require('../../Toda_Images/bgtoda1.png')}>
                    <View style={styles.headerColumn}>

                        <View style={styles.userImage}>
                            <Text style={{ fontSize: 45, color: '#fff' }}>
                                {anhDaiDien}
                            </Text>
                        </View>

                        <Text style={styles.userNameText}>{hoTen}</Text>
                        <View style={styles.userAddressRow}>
                        </View>
                    </View>
                </ImageBackground>
            </View>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.tieude}>
                <TouchableOpacity onPress={() => { navigation.goBack() }} style={{ marginLeft: 10 }}>
                    <Icon type="feather" name="arrow-left" size={24} color={"#fff"} />
                </TouchableOpacity>
                <Text style={styles.text_tieude}>Chi tiết cuộc gọi</Text>
                {isAdd ?
                    <TouchableOpacity onPress={() => { setIsVisible(true) }} style={{ marginRight: 10 }}>
                        <Icon type="ionicons" name="person-add" size={24} color={"#fff"} />
                    </TouchableOpacity>
                    :
                    <View style={{ width: 24, marginRight: 10 }}></View>
                }

            </View>
            <ScrollView style={styles.scroll}>
                <View style={styles.container}>
                    <Card containerStyle={styles.cardContainer}>
                        {renderHeader()}
                        <Tooltip
                            isVisible={toolTipVisible}
                            content={
                                <TouchableOpacity onPress={copy}>
                                    <Text>Copy</Text>
                                </TouchableOpacity>
                            }
                            placement="bottom"
                            onClose={() => setToolTipVisible(false)}>

                            <TouchableOpacity
                                onPress={() => {
                                    setTimeout(() => {
                                        storeData.setStoreDataValue(keyStoreData.soDienThoaiDi, soDienThoai);
                                        storeData.setStoreDataValue(keyStoreData.hoTenDienThoaiDi, item.ho_ten);
                                        storeData.setStoreDataValue(keyStoreData.typeCall, typeCallEnum.outgoingCall);
                                        navigation.navigate('CuocGoi');
                                    }, 200);
                                }}
                                onLongPress={() => setToolTipVisible(true)}
                            >
                                <View style={styles.containerTel}>
                                    <View style={styles.iconRow}>
                                        <Icon
                                            name="call"
                                            underlayColor="transparent"
                                            iconStyle={styles.telIcon}
                                        />
                                    </View>
                                    <View style={styles.telRow}>
                                        <View style={styles.telNumberColumn}>
                                            <Text style={styles.telNumberText}>{soDienThoai}</Text>
                                        </View>
                                    </View>

                                </View>
                            </TouchableOpacity>

                        </Tooltip>
                        <View style={{ width: "100%", height: 1.6, backgroundColor: "#EDEDED" }}></View>
                        <View style={{ padding: 10 }}>

                            <FlatList data={listData || []}
                                keyExtractor={(item, index) => index.toString()}
                                renderItem={({ item, index }) => {
                                    return (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 5 }}>
                                            <Text style={styles.emailNameText}>{item.ngay_goi}</Text>

                                            {item.kieu_cuoc_goi == CallTypeEnum.MissingCall ? (
                                                <Text style={styles.emailNameTextv2}>Cuộc gọi nhỡ</Text>
                                            ) : item.kieu_cuoc_goi == CallTypeEnum.IncomingCall ? (
                                                <Text style={styles.emailNameTextv2}>Cuộc gọi đến</Text>
                                            ) : (
                                                <Text style={styles.emailNameTextv2}>Cuộc gọi đi</Text>
                                            )}
                                        </View>
                                    )
                                }}
                            ></FlatList>

                        </View>
                    </Card>
                </View>
            </ScrollView>
            <Overlay isVisible={isVisible} onBackdropPress={() => {
                setIsVisible(false);
                setContactName('');
            }}>
                <View style={{ justifyContent: 'center', width: widthScreen - 60 }}>
                    <Text style={{ fontSize: 18, color: '#1976d2', fontWeight: 'bold', marginTop: 5 }}>Thêm liên hệ</Text>
                    <TextInput style={{ borderRadius: 5, minHeight: 40, borderWidth: 0.5, padding: 5, marginTop: 15 }}
                        placeholder={"Nhập họ tên"}
                        value={contactName}
                        onChangeText={(text) => {
                            setContactName(text);
                        }}></TextInput>
                    <TextInput keyboardType={'phone-pad'}
                        editable={false}
                        style={{ borderRadius: 5, minHeight: 40, borderWidth: 0.5, padding: 5, marginTop: 10 }}
                        placeholder={"Nhập số điện thoại"}
                        value={soDienThoai}
                        readonly={true}
                    ></TextInput>
                    <TouchableOpacity onPress={() => {
                        if (contactName !== "") {
                            setIsAdd(false);
                            setIsVisible(false);
                        } else {
                            Alert.alert("Lỗi!", "Vui lòng họ tên")
                        }

                    }} style={styles.buttonConfirm2}>
                        <Text style={styles.textConfirm}>Lưu</Text>
                    </TouchableOpacity>
                </View>
            </Overlay>
        </SafeAreaView>
    );

}

const styles = StyleSheet.create({
    cardContainer: {
        backgroundColor: '#FFF',
        borderWidth: 0,
        flex: 1,
        margin: 0,
        padding: 0,
    },
    container: {
        flex: 1,
    },
    emailContainer: {
        backgroundColor: '#FFF',
        flex: 1,
        paddingTop: 30,
    },
    headerBackgroundImage: {
        paddingBottom: 20,
        paddingTop: 35,
    },
    headerContainer: {},
    headerColumn: {
        backgroundColor: 'transparent',
        ...Platform.select({
            ios: {
                alignItems: 'center',
                elevation: 1,
                marginTop: -1,
            },
            android: {
                alignItems: 'center',
            },
        }),
    },
    placeIcon: {
        color: 'white',
        fontSize: 26,
    },
    scroll: {
        backgroundColor: '#FFF',
    },
    telContainer: {
        backgroundColor: '#FFF',
        flex: 1,
        paddingTop: 30,
    },
    userAddressRow: {
        alignItems: 'center',
        flexDirection: 'row',
    },
    userCityRow: {
        backgroundColor: 'transparent',
    },
    userCityText: {
        color: '#A5A5A5',
        fontSize: 15,
        fontWeight: '600',
        textAlign: 'center',
    },
    userImage: {
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: '#FFF',
        borderRadius: 85,
        borderWidth: 3,
        backgroundColor: '#1976d2',
        height: 150,
        marginBottom: 15,
        width: 150,
    },
    userNameText: {
        color: '#FFF',
        fontSize: 22,
        fontWeight: 'bold',
        paddingBottom: 8,
        textAlign: 'center',
    },
    tieude: {
        flexDirection: 'row',
        backgroundColor: '#1976d2',
        width: widthScreen,
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

    //tel css
    containerTel: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginBottom: 25,
        marginTop: 20,
    },
    iconRow: {
        flex: 2,
        justifyContent: 'center',
    },
    smsIcon: {
        color: 'darkgray',
        fontSize: 30,
    },
    smsRow: {
        flex: 2,
        justifyContent: 'flex-start',
    },
    telIcon: {
        color: '#00FF33',
        fontSize: 30,
    },
    telNameColumn: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
    },
    telNameText: {
        color: 'gray',
        fontSize: 14,
        fontWeight: '200',
    },
    telNumberColumn: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginBottom: 5,
    },
    telNumberText: {
        fontSize: 16,
    },
    telRow: {
        flex: 6,
        flexDirection: 'column',
        justifyContent: 'center',
    },

    //email
    containerEmail: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginLeft: 20,
        marginBottom: 25,
        marginTop: 20,
    },
    emailColumn: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginBottom: 5,
    },
    emailIcon: {
        color: 'gray',
        fontSize: 30,
    },
    emailNameColumn: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
    },
    emailNameText: {
        fontSize: 13,
        width: 100
    },
    emailNameTextv2: {
        fontSize: 13,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    emailRow: {
        flex: 8,
        flexDirection: 'column',
        justifyContent: 'center',
    },
    emailText: {
        fontSize: 16,
        fontWeight: 'bold',
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
