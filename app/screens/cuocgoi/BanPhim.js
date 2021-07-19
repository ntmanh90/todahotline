import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Dimensions, SafeAreaView, Alert, TouchableOpacity, FlatList, Platform, PermissionsAndroid, StatusBar } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import storeData from '../../hooks/storeData';
import { getHub, getHubAndReconnect } from '../../hubmanager/HubManager';
import keyStoreData from '../../utils/keyStoreData';
import useCheckPermistion from '../../hooks/useCheckPermistion';
import KeypadButton from '../../components/KeypadButton';
import Clipboard from '@react-native-community/clipboard';
import dongBoDanhBaHeThong from '../../utils/dongBoDanhBaHeThong';
import DeviceInfo from 'react-native-device-info';
import { openDatabase } from 'react-native-sqlite-storage';
import Tooltip from "react-native-walkthrough-tooltip";
import useGetHoTenDanhBa from '../../hooks/useGetHoTenDanhBa';
import BackgroundTimer from 'react-native-background-timer';
import typeCallEnum from '../../utils/typeCallEnum';

BackgroundTimer.start();
const IOS = Platform.OS === 'ios';
var db = openDatabase({ name: 'UserDatabase.db' });

function BanPhim({ navigation }) {
    const [soDienThoai, setSoDienThoai] = useState('');
    const [listSearhDanhBa, setListSearhDanhBa] = useState([]);
    const [showTip, setTip] = useState(false);
    const check_Permission = useCheckPermistion();

    const cuocGoiDi = async () => {
        if (soDienThoai.length < 3) {
            alert('Số điện thoại không đúng định dạng');
        }
        else {
            let termHoTen = soDienThoai;

            db.transaction((tx) => {
                tx.executeSql("SELECT * FROM DanhBa WHERE so_dien_thoai = ?", [soDienThoai],
                    (tx, { rows }) => {
                        console.log('getHoTenTheoSoDienThoai', rows);
                        if (rows.length > 0) {
                            termHoTen = rows.item(0).ho_ten;
                        }
                    },
                    (tx, error) => {
                        console.log('Error list cuoc goi: ', error, tx);
                    }
                );
            });
            console.log('Dữ liệu truyền sang màn hình cuộc gọi: ', soDienThoai, termHoTen, typeCallEnum.outgoingCall);
            navigation.navigate('CuocGoi', { soDienThoai: soDienThoai, hoTen: termHoTen, type: typeCallEnum.outgoingCall });
        }
    }

    const handleKeypadPressed = (value) => {
        let tmp = soDienThoai;
        tmp = tmp + value.trim();
        setSoDienThoai(tmp);

        if (soDienThoai.length > 0) {

            db.transaction((tx) => {
                tx.executeSql("SELECT * FROM DanhBa WHERE so_dien_thoai LIKE '%" + soDienThoai + "%' ORDER BY ho_ten", [],
                    (tx, { rows }) => {
                        let temp = [];
                        for (let i = 0; i < rows.length; i++) {
                            temp.push(rows.item(i));
                        }
                        setListSearhDanhBa(temp);
                    },
                    (tx, error) => {
                        console.log('Error list cuoc goi: ', error);
                    }
                );
            });

        }
    }

    const deleteNumber = () => {
        var tmp = soDienThoai;
        tmp = tmp.substr(0, tmp.length - 1);
        setSoDienThoai(tmp);
    }

    const keypadLongPressed = () => {
        setSoDienThoai('');
    }

    const copyOrFetch = async () => {
        setTip(false);
        if (soDienThoai.length > 0) {
            Clipboard.setString(soDienThoai.toString());
        }
    }

    const DongBoDanhBaDataBase = () => {
        if (IOS) {
            Contacts.checkPermission().then((permission) => {
                console.log('check', permission);
                if (permission === 'undefined') {
                    Contacts.requestPermission().then((per) => {
                        dongBoDanhBaHeThong.themDanhBa();
                    });
                }
                if (permission === 'authorized') {
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
                        { cancelable: false },
                    );
                }
            });
        }
        else {
            PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
                {
                    'title': 'Contacts',
                    'message': 'This app would like to view your contacts.',
                    'buttonPositive': 'Please accept bare mortal'
                }
            )
                .then(() => {
                    dongBoDanhBaHeThong.themDanhBa();
                });
        }
    }

    const requestPermissionsAndroid = () => {
        if (!IOS) {
            check_Permission.requestCallPhonePermission().then(() => {
                if (check_Permission.callPhone === false) {
                    Alert.alert(
                        'Thông báo',
                        'Bạn chưa cấp quyền điện thoại ?',
                        [
                            {
                                text: 'Cấp quyền',
                                onPress: () => { check_Permission.requestCallPhonePermission() }
                            },
                        ],
                        { cancelable: false },
                    );
                }
            });

            check_Permission.requestRecordAudioPermission().then(() => {
                if (check_Permission.recordAudio === false) {
                    Alert.alert(
                        'Thông báo',
                        'Bạn chưa cấp quyền microphone ?',
                        [
                            {
                                text: 'Cấp quyền',
                                onPress: () => { check_Permission.requestRecordAudioPermission() }
                            },
                        ],
                        { cancelable: false },
                    );
                }
            });


            DeviceInfo.getApiLevel().then((apiLevel) => {
                if (apiLevel < 30) {
                    check_Permission.requestReadPhoneStatePermission().then(() => {
                        if (check_Permission.readPhoneState === false) {
                            Alert.alert(
                                'Thông báo',
                                'Bạn chưa cấp quyền tài khoản cuộc gọi ?',
                                [
                                    {
                                        text: 'Cấp quyền',
                                        onPress: () => { check_Permission.requestReadPhoneStatePermission() }
                                    },
                                ],
                                { cancelable: false },
                            );
                        }
                    });
                }
            });
        }
    }

    React.useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            conn = getHubAndReconnect();
            requestPermissionsAndroid();

        });

        return unsubscribe;
    }, [navigation]);

    useEffect(() => {
        DongBoDanhBaDataBase();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <View style={{ flex: 1 }}>

                <View style={{ alignItems: 'center', justifyContent: 'center' }}>

                    <Tooltip
                        isVisible={showTip}
                        content={
                            <TouchableOpacity onPress={copyOrFetch}>
                                <Text> Copy </Text>
                            </TouchableOpacity>
                        }
                        onClose={() => setTip(false)}
                        placement="bottom"
                        // below is for the status bar of react navigation bar
                        topAdjustment={0}
                    >
                        <TouchableOpacity
                            style={[{ width: '100%', marginTop: 40 }, styles.button]}
                            onPress={() => setTip(true)}
                        >
                            <Text style={{ fontSize: 24 }}>{soDienThoai}</Text>
                        </TouchableOpacity>
                    </Tooltip>
                </View>



                {soDienThoai.length > 0 ? (
                    <FlatList
                        style={styles.itemStyle}
                        data={listSearhDanhBa || []}
                        renderItem={({ item, index }) => {
                            return (
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomColor: '#dfdfdf', borderBottomWidth: 1, paddingVertical: 4, marginHorizontal: 15 }}>
                                    <Text style={styles.text_tenNguoiGoi}>
                                        {item.ho_ten}
                                    </Text>
                                    <Text style={styles.text_soDienThoaiNguoiGoi}>
                                        {item.so_dien_thoai}
                                    </Text>
                                </View>
                            );
                        }}
                        keyExtractor={(item, index) => index.toString()}>

                    </FlatList>
                ) : (
                    <Text></Text>
                )}
            </View>
            <View>
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

                <View style={styles.row}>
                    {(soDienThoai.length == 0) ? null : <TouchableOpacity
                        style={[
                            styles.buttonCircle,
                            styles.invisible,
                        ]}></TouchableOpacity>}

                    <TouchableOpacity
                        onPress={cuocGoiDi}
                        style={[styles.buttonCircle, styles.bgSuccess]}>
                        <Ionicons name="ios-call" style={styles.btnSuccess} size={35} />
                    </TouchableOpacity>
                    {(soDienThoai.length == 0) ? null : <TouchableOpacity
                        style={styles.buttonCircle}
                        onPress={deleteNumber}
                        onLongPress={keypadLongPressed}>
                        <Ionicons name="backspace-outline" style={styles.btnbgDanger} size={40} />
                    </TouchableOpacity>}

                </View>
            </View>


            {/* <Text>Số của bạn: {soDienThoai}</Text>
            <Text>Số điện thoại</Text>
            <Input
                onChangeText={(value) => setSoDienThoai(value)}
                placeholder='Nhập số gọi ra'
                leftIcon={
                    <Icon
                        name='phone'
                        size={24}
                        color='black'
                    />
                }
            />
            <Button onPress={cuocGoiDi} title='Call' /> */}
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
        marginBottom: 0
    },
    keypadrow: {
        flexDirection: "row",
        alignSelf: "center"
    },
    keypadbutton: {
        margin: 10,
        width: DEVICE_WIDTH / 5,
        height: DEVICE_WIDTH / 5,
        borderWidth: 0,
        backgroundColor: "#F5F5F5",
        borderRadius: DEVICE_WIDTH / 10,
        paddingTop: 7
    },


    itemStyle: {
        backgroundColor: '#ffffff',
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
        textAlign: 'right'
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