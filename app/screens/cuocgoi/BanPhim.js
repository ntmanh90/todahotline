import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Dimensions, SafeAreaView, TouchableOpacity, FlatList } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import storeData from '../../hooks/storeData';
import { Input, Button } from 'react-native-elements';
import { getHub, getHubAndReconnect } from '../../hubmanager/HubManager';
import * as RootNavigation from '../../navigation/RootNavigation';
import keyStoreData from '../../utils/keyStoreData';
import useCheckPermistion from '../../hooks/useCheckPermistion';
import KeypadButton from '../../components/KeypadButton';
import Clipboard from '@react-native-community/clipboard';

var conn = getHubAndReconnect();

let listNoiBo = [];
function BanPhim({ navigation }) {
    const [soDienThoai, setSoDienThoai] = useState('');
    const [search, setSearch] = useState('');

    const check_Permission = useCheckPermistion();

    const cuocGoiDi = () => {
        if (soDienThoai.length < 3) {
            alert('Số điện thoại không đúng định dạng');
        }
        else {
            storeData.setStoreDataValue(keyStoreData.soDienThoai, soDienThoai);
            navigation.navigate('CuocGoiDi', { soDienThoai: soDienThoai, hoTen: soDienThoai });
        }
    }
    const handleKeypadPressed = (value) => {
        let tmp = soDienThoai;
        tmp = tmp + value.trim();
        setSoDienThoai(tmp);

    }

    const deleteNumber = () => {
        var tmp = soDienThoai;
        tmp = tmp.substr(0, tmp.length - 1);
        setSoDienThoai(tmp);
        setSearch(tmp);
    }

    const keypadLongPressed = () => {
        setSoDienThoai('');
        setSearch('');
    }

    const copyOrFetch = async () => {
        if (soDienThoai.length > 0) {
            Clipboard.setString(soDienThoai);
        }
        else {
            const text = await Clipboard.getString();
            if (text.length > 0)
                setSoDienThoai(text);
        }
    }

    React.useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            conn = getHubAndReconnect();
            check_Permission.checkAllPermissions();
        });

        return unsubscribe;
    }, [navigation]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={{ flex: 1 }}>
                <TouchableOpacity onPress={copyOrFetch}>
                    <Text style={{ fontSize: 30, textAlign: 'center', marginTop: 10 }}>{soDienThoai}</Text>
                </TouchableOpacity>

                {soDienThoai.length > 0 ? (
                    <FlatList
                        style={styles.itemStyle}
                        data={listNoiBo || []}
                        renderItem={({ item, index }) => {
                            return (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={styles.text_tenNguoiGoi}>
                                        {item.contact_name}
                                    </Text>
                                    <View style={{ flex: 1 }}></View>
                                    <Text style={styles.text_soDienThoaiNguoiGoi}>
                                        {item.contact_phone}
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
        marginLeft: 10,
        fontSize: 16,
    },
    text_soDienThoaiNguoiGoi: {
        color: '#808080',
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

export default BanPhim;