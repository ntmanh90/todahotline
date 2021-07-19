import React, { useState, useEffect } from 'react';
import {
    TouchableOpacity,
    Dimensions,
    StyleSheet,
    View,
    Platform,
    ActivityIndicator,
    SafeAreaView,
    Alert,
    Text
} from 'react-native';

import Clipboard from '@react-native-community/clipboard';
import Keypad from '../Keypad/Keypad';
import Coppyable from '../Custom_Component/CoppyableNumberInput';
import Tooltip from 'react-native-walkthrough-tooltip';
const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;

function PopUpDialerScreeen() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [toolTipVisiblev2, setToolTipVisiblev2] = useState(false);


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
                <Keypad keyPressed={(e) => this._keypadPressed(e)} />

                <View style={styles.row}>
                    <TouchableOpacity
                        onPress={() => { this.props.hideDialer() }}
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
    itemStyle: {
        backgroundColor: '#000c',
        width: DEVICE_WIDTH,
    },
    text_tenNguoiGoi: {
        color: '#000000',
        marginLeft: 10,
        fontSize: 16,
    },
    text_SDTNguoiGoi: {
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

export default PopUpDialerScreeen;
