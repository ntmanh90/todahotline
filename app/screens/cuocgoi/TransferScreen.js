import React, { useState, useEffect } from 'react';
import {
    TouchableOpacity,
    Dimensions,
    StyleSheet,
    View,
    SafeAreaView,
    FlatList,
    Alert,
} from 'react-native';
import { Text, Icon } from 'react-native-elements';
import Clipboard from '@react-native-community/clipboard';
import Coppyable from '../../components/CoppyableNumberInput';
import storeData from '../../hooks/storeData';
import Tooltip from 'react-native-walkthrough-tooltip';
const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;
import { openDatabase } from 'react-native-sqlite-storage';
import keyStoreData from '../../utils/keyStoreData';
import ProgressApp from '../../components/ProgressApp';
import KeypadButton from '../../components/KeypadButton';
import { getHubAndReconnect } from '../../hubmanager/HubManager';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import typeCallEnum from '../../utils/typeCallEnum';

var db = openDatabase({ name: 'UserDatabase.db' });

var conn = getHubAndReconnect();

function TransferScreen({ numberIncoming, isCuocGoiTransfer, hideTransfer, hideModal }) {
    console.log('[numberIncoming Transfer]', numberIncoming);

    const navigation = useNavigation();

    const [phoneNumber, setPhoneNumber] = useState('');
    const [toolTipVisiblev2, setToolTipVisiblev2] = useState(false);
    const [listNoiBo, setListNoiBo] = useState([]);
    const [listContact, setListContact] = useState([]);
    const [showProcess, setShowProcess] = useState(true);

    useEffect(() => {
        loadDataContact();
    }, []);


    const startCall = async (number) => {
        console.log('[Start Call]');
        let termHoTen = number;
        db.transaction((tx) => {
            tx.executeSql("SELECT * FROM DanhBa WHERE so_dien_thoai = ?", [number],
                (tx, { rows }) => {
                    console.log('getHoTenTheoSoDienThoai', rows);
                    if (rows.length > 0) {
                        termHoTen = rows.item(0).ho_ten;
                    }
                },
                (tx, error) => {
                    console.log('Error check tên số điện thoại ', error);
                }
            );
        });

        let quyengoiRa = await storeData.getStoreDataValue(keyStoreData.quyenGoiRa);
        console.log('[quyengoira]', quyengoiRa);
        console.log('[isCuocGoiTransfer]', isCuocGoiTransfer);

        if (quyengoiRa == '1') {
            if (isCuocGoiTransfer) {

                setTimeout(() => {
                    hideTransfer();
                    hideModal();
                    navigation.navigate('CuocGoiTransfer', { subCallNumber: number, subCallName: termHoTen });
                }, 200);

            }
            else {
                conn.invoke('Transfer', numberIncoming, number);
                hideTransfer();
                console.log('Chưa viết code tranfer sang cuộc gọi khác > 10 số')
            }
        } else {
            if (isCuocGoiTransfer) {
                setTimeout(() => {
                    hideTransfer();
                    hideModal();
                    navigation.navigate('CuocGoiTransfer', { subCallNumber: number, subCallName: termHoTen });
                }, 200);

            }
            else {
                conn.invoke('Transfer', numberIncoming, number);
                hideTransfer();
                console.log('Chưa viết code tranfer sang cuộc gọi khác > 10 số')
            }
        }
    }

    const deleteNumber = () => {
        var tmp = phoneNumber;
        tmp = tmp.substr(0, tmp.length - 1);
        setPhoneNumber(tmp);
        search(tmp);
    }
    const keypadLongPressed = () => {
        console.log('Long press');
        setPhoneNumber('')
        search('');
    }

    const _keypadPressed = (value) => {
        var tmp = phoneNumber + value;
        setPhoneNumber(tmp);
        search(tmp);
    }

    const fetchCopiedText = async () => {
        const text = await Clipboard.getString();
        setPhoneNumber(text)
    };
    const copy = () => {
        Clipboard.setString(phoneNumber);
        setToolTipVisiblev2(false);
    };

    const loadDataContact = async () => {


        db.transaction((tx) => {
            tx.executeSql('SELECT * FROM DanhBa', [], (tx, results) => {
                var temp = [];
                for (let i = 0; i < results.rows.length; ++i) {
                    temp.push(results.rows.item(i));
                }
                temp.sort();
                temp.reverse();
                setListContact(temp);
                setShowProcess(false);
            });
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

    const selectItem = (so_dien_thoai) => {
        console.log('[Select Item]', so_dien_thoai);
        setPhoneNumber(so_dien_thoai);
        search(so_dien_thoai)
    }

    const search = (text) => {
        if (text === '') {
            setListNoiBo([]);
        } else {
            var ttt = text.toLowerCase();
            var listTest = listContact;
            const newData = listTest.filter((item) => {
                const itemData = `${item.so_dien_thoai.toUpperCase()}`;
                const textData = ttt.toUpperCase();

                return itemData.indexOf(textData) > -1;
            });

            setListNoiBo(newData);
        }
    }


    return (
        <SafeAreaView style={styles.container}>
            <View style={{ flex: 1 }}>
                {phoneNumber.length === 0 ? (
                    <Coppyable
                        phoneNumber={phoneNumber}
                        onCopy={(e) => fetchCopiedText()}
                    />
                ) : (
                    <View style={styles.rowv2}>
                        <Tooltip
                            isVisible={toolTipVisiblev2}
                            content={
                                <TouchableOpacity onPress={(e) => copy()}>
                                    <Text>Copy</Text>
                                </TouchableOpacity>
                            }
                            placement="right"
                            onClose={() => setToolTipVisiblev2(false)}>
                            <TouchableOpacity
                                style={{ minWidth: 100 }}
                                onLongPress={() => setToolTipVisiblev2(true)}>
                                <Text
                                    style={{ fontSize: 30, maxHeight: 40, alignSelf: 'center', color: "#fff" }}>
                                    {phoneNumber}
                                </Text>
                            </TouchableOpacity>
                        </Tooltip>
                    </View>
                )}

                {phoneNumber.length > 0 ? (

                    <FlatList
                        style={styles.itemStyle}
                        data={listNoiBo || []}
                        renderItem={({ item, index }) => {
                            return (
                                <TouchableOpacity
                                    onPress={() => selectItem(item.so_dien_thoai)}
                                    style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomColor: '#dfdfdf', borderBottomWidth: 1, paddingVertical: 4, marginHorizontal: 15 }}>
                                    <Text style={styles.text_tenNguoiGoi}>
                                        {item.ho_ten}
                                    </Text>
                                    <Text style={styles.text_soDienThoai}>
                                        {item.so_dien_thoai}
                                    </Text>
                                </TouchableOpacity>
                            );
                        }}
                        keyExtractor={(item, index) => index.toString()}>

                    </FlatList>

                ) : (
                    <Text></Text>
                )}
            </View>
            <View style={{ flex: 4 }}>

                <View style={styles.keypad}>
                    <View style={styles.keypadrow}>
                        <KeypadButton
                            style={styles.keypadbutton}
                            txt1="1"
                            txt2=""
                            onPress={() => _keypadPressed('1')}
                        />
                        <KeypadButton
                            style={styles.keypadbutton}
                            txt1="2"
                            txt2="A B C"
                            onPress={() => _keypadPressed('2')}
                        />
                        <KeypadButton
                            style={styles.keypadbutton}
                            txt1="3"
                            txt2="D E F"
                            onPress={() => _keypadPressed('3')}
                        />
                    </View>
                    <View style={styles.keypadrow}>
                        <KeypadButton
                            style={styles.keypadbutton}
                            txt1="4"
                            txt2="G H I"
                            onPress={() => _keypadPressed('4')}
                        />
                        <KeypadButton
                            style={styles.keypadbutton}
                            txt1="5"
                            txt2="J K L"
                            onPress={() => _keypadPressed('5')}
                        />
                        <KeypadButton
                            style={styles.keypadbutton}
                            txt1="6"
                            txt2="M N O"
                            onPress={() => _keypadPressed('6')}
                        />
                    </View>
                    <View style={styles.keypadrow}>
                        <KeypadButton
                            style={styles.keypadbutton}
                            txt1="7"
                            txt2="P Q R S"
                            onPress={() => _keypadPressed('7')}
                        />
                        <KeypadButton
                            style={styles.keypadbutton}
                            txt1="8"
                            txt2="T U V"
                            onPress={() => _keypadPressed('8')}
                        />
                        <KeypadButton
                            style={styles.keypadbutton}
                            txt1="9"
                            txt2="W X Y Z"
                            onPress={() => _keypadPressed('9')}
                        />
                    </View>
                    <View style={styles.keypadrow}>
                        <KeypadButton
                            style={styles.keypadbutton}
                            txt1="*"
                            txt2=""
                            onPress={() => _keypadPressed('*')}
                        />
                        <KeypadButton
                            style={styles.keypadbutton}
                            txt1="0"
                            txt2="+"
                            onPress={() => _keypadPressed('0')}
                        />
                        <KeypadButton
                            style={styles.keypadbutton}
                            txt1="#"
                            txt2=""
                            onPress={() => _keypadPressed('#')}
                        />
                    </View>
                </View>

                <View style={{ flexDirection: 'row', alignSelf: 'center', flex: 1 }}>
                    <TouchableOpacity
                        onPress={() => { hideTransfer() }}
                        style={[styles.buttonCircle]}>
                        <Text style={{ fontSize: 18, color: "#fff" }}>Ẩn</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={(e) => startCall(phoneNumber)}
                        style={[styles.buttonCircle, styles.bgSuccess]}>
                        <Icon style={styles.btnSuccess} name="call" />
                    </TouchableOpacity>

                    {(phoneNumber.length == 0) ? null :
                        <TouchableOpacity
                            style={styles.buttonCircle}
                            onPress={deleteNumber}
                            onLongPress={keypadLongPressed}>
                            <Ionicons name="backspace-outline" style={styles.btnbgDanger} size={40} />
                        </TouchableOpacity>
                    }

                </View>
            </View>
            {renderProcess()}
        </SafeAreaView>
    );

}

var styles = StyleSheet.create({
    container: {
        backgroundColor: '#000c',
        flex: 1,
    },
    itemStyle: {
        width: DEVICE_WIDTH,
    },
    text_tenNguoiGoi: {
        color: '#fff',
        marginLeft: 10,
        fontSize: 16,
    },
    text_SDTNguoiGoi: {
        color: '#f2f2f2',
        marginLeft: 10,
        fontSize: 15,
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
    itemStyle: {
        width: DEVICE_WIDTH,
    },
    text_tenNguoiGoi: {
        color: '#fff',
        textAlign: 'left',
        fontSize: 16,
    },
    text_soDienThoaiNguoiGoi: {
        color: '#fff',
        fontSize: 15,
        textAlign: 'right'
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
    }
});


export default TransferScreen;