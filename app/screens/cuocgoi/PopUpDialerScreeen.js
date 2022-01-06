import React, { useState, useEffect } from 'react';
import {
    TouchableOpacity,
    Dimensions,
    StyleSheet,
    View,
    SafeAreaView,
    Text
} from 'react-native';

import Clipboard from '@react-native-community/clipboard';
import Coppyable from '../../components/CoppyableNumberInput';
import Tooltip from 'react-native-walkthrough-tooltip';
import showUICallEnum from '../../utils/showUICallEnum';
import KeypadButton from '../../components/KeypadButton';
const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;

function PopUpDialerScreeen({ hideDialer, dtmf }) {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [toolTipVisiblev2, setToolTipVisiblev2] = useState(false);


    const _keypadPressed = (value) => {
        console.log('value ', value);
        var tmp = phoneNumber + value;
        setPhoneNumber(tmp);
        dtmf(value);
    }

    const fetchCopiedText = async () => {
        const text = await Clipboard.getString();
        setPhoneNumber(text)
    };
    const copy = () => {
        Clipboard.setString(phoneNumber);
        setToolTipVisiblev2(false);
    };


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


            </View>
            <View style={{}}>
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

                <View style={styles.row}>
                    <TouchableOpacity
                        onPress={() => { hideDialer(showUICallEnum.UICall) }}
                        style={[styles.buttonCircle]}>
                        <Text style={{ fontSize: 18, color: "#fff" }}>Ẩn</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

var styles = StyleSheet.create({
    container: {
        backgroundColor: '#000c',
        flex: 1,
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

    row: {
        flexDirection: 'row',
        alignSelf: 'center',
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

export default PopUpDialerScreeen;
