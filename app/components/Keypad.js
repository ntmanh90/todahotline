import React, { } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import KeypadButton from './KeypadButton';
const DEVICE_WIDTH = Dimensions.get('window').width;


export default function Keypad({ keyPressed }) {

    const handleKeypadPressed = (value) => {
        keyPressed(value);
    }

    return (
        <View style={styles.keypad}>
            <View style={styles.keypadrow}>
                <KeypadButton
                    style={styles.keypadbutton}
                    txt1="1"
                    txt2=""
                    onPress={handleKeypadPressed('1')}
                />
                <KeypadButton
                    style={styles.keypadbutton}
                    txt1="2"
                    txt2="A B C"
                    onPress={handleKeypadPressed('2')}
                />
                <KeypadButton
                    style={styles.keypadbutton}
                    txt1="3"
                    txt2="D E F"
                    onPress={handleKeypadPressed('3')}
                />
            </View>
            <View style={styles.keypadrow}>
                <KeypadButton
                    style={styles.keypadbutton}
                    txt1="4"
                    txt2="G H I"
                    onPress={handleKeypadPressed('4')}
                />
                <KeypadButton
                    style={styles.keypadbutton}
                    txt1="5"
                    txt2="J K L"
                    onPress={handleKeypadPressed('5')}
                />
                <KeypadButton
                    style={styles.keypadbutton}
                    txt1="6"
                    txt2="M N O"
                    onPress={handleKeypadPressed('6')}
                />
            </View>
            <View style={styles.keypadrow}>
                <KeypadButton
                    style={styles.keypadbutton}
                    txt1="7"
                    txt2="P Q R S"
                    onPress={handleKeypadPressed('7')}
                />
                <KeypadButton
                    style={styles.keypadbutton}
                    txt1="8"
                    txt2="T U V"
                    onPress={handleKeypadPressed('8')}
                />
                <KeypadButton
                    style={styles.keypadbutton}
                    txt1="9"
                    txt2="W X Y Z"
                    onPress={handleKeypadPressed('9')}
                />
            </View>
            <View style={styles.keypadrow}>
                <KeypadButton
                    style={styles.keypadbutton}
                    txt1="*"
                    txt2=""
                    onPress={handleKeypadPressed('*')}
                />
                <KeypadButton
                    style={styles.keypadbutton}
                    txt1="0"
                    txt2="+"
                    onPress={handleKeypadPressed('0')}
                />
                <KeypadButton
                    style={styles.keypadbutton}
                    txt1="#"
                    txt2=""
                    onPress={handleKeypadPressed('#')}
                />
            </View>
        </View>
    );
}




var styles = StyleSheet.create({
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