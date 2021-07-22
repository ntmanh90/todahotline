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
import Keypad from '../../components/Keypad';
import Coppyable from '../../components/CoppyableNumberInput';
import storeData from '../../hooks/storeData';
import Tooltip from 'react-native-walkthrough-tooltip';
const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;
import { openDatabase } from 'react-native-sqlite-storage';
import keyStoreData from '../../utils/keyStoreData';
import ProgressApp from '../../components/ProgressApp';
var db = openDatabase({ name: 'UserDatabase.db' });

function TransferScreen() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [toolTipVisiblev2, setToolTipVisiblev2] = useState(false);
    const [listNoiBo, setListNoiBo] = useState([]);
    const [listContact, setListContact] = useState([]);
    const [showProcess, setShowProcess] = useState(true);
    const [checkQuyenGoiRaNgoai, setCheckQuyenGoiRaNgoai] = useState(1);

    useEffect(() => {
        loadDataContact();
    }, []);


    const startCall = (number) => {

        if (checkQuyenGoiRaNgoai == 0) {
            var isCall = false
            var callName = number
            for (let index = 0; index < listContact.length; index++) {
                const element = listContact[index];
                if (element.contact_phone == number && (element.contact_status == 2 || element.contact_status == 3)) {
                    callName = element.contact_name
                    isCall = true
                    break
                }

            }
            if (number.length < 10) {
                // đoạn này là tranfer sang cuộc gọi khác
                console.log('Chưa viết code tranfer sang cuộc gọi khác')
            } else {
                Alert.alert(
                    'Thông báo ',
                    'Bạn không có quyền gọi ra ,vui lòng liên hệ với quản trị viên !');
            }
        } else {
            var callName = number
            for (let index = 0; index < listContact.length; index++) {
                const element = listContact[index];
                if (element.contact_phone == number) {
                    callName = element.contact_name
                    break
                }

            }
            // đoạn này là tranfer sang cuộc gọi khác lớn hơn 10 số
            console.log('Chưa viết code tranfer sang cuộc gọi khác > 10 số')
        }
    }

    const deleteNumber = () => {
        var tmp = phoneNumber;
        tmp = tmp.substr(0, tmp.length - 1);
        setPhoneNumber(tmp);
        search(tmp);
    }

    const _keypadLongPressed = () => {
        console.log('Long press');
        setPhoneNumber('')
        search('');
    }

    const _keypadPressed = (value) => {
        var tmp = phoneNumber + value;
        this.setState({ phoneNumber: tmp });
        setPhoneNumber(tmp)
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
        let quyengoiSDT = await storeData.getStoreDataValue(keyStoreData.quyenGoiRa);
        setCheckQuyenGoiRaNgoai(parseInt(quyengoiSDT));

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

    const search = (text) => {
        if (text === '') {
            setListNoiBo([]);
        } else {
            var ttt = text.toLowerCase();
            var listTest = listContact;
            const newData = listTest.filter((item) => {
                const itemData = `${item.contact_phone.toUpperCase()}`;
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
                                <ListItem
                                    onPress={() => { setPhoneNumber(item.contact_phone); search(item.contact_phone) }}>
                                    <Body>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Text style={styles.text_tenNguoiGoi}>
                                                {item.contact_name}
                                            </Text>
                                            <View style={{ flex: 1 }}></View>
                                            <Text style={styles.text_SDTNguoiGoi}>
                                                {item.contact_phone}
                                            </Text>
                                        </View>
                                    </Body>
                                </ListItem>
                            );
                        }}
                        keyExtractor={(item, index) => index.toString()}></FlatList>
                ) : (
                    <Text></Text>
                )}
            </View>
            <View style={{}}>
                <Keypad keyPressed={(e) => _keypadPressed(e)} />

                <View style={styles.row}>
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
                    {(phoneNumber.length == 0) ?
                        <View style={[styles.buttonCircle, styles.invisible,]}></View>
                        :
                        <TouchableOpacity
                            style={styles.buttonCircle}
                            onPress={(e) => deleteNumber()}
                            onLongPress={(e) => _keypadLongPressed()}>
                            <Icon style={styles.btnbgDanger} type="Feather" name="delete" />
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


export default TransferScreen;