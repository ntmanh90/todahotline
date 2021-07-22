import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

function TextImage({ name, placeholder, text, secureText = false, eye = false, ...otherProps }) {
    const [eyeName, setEyeName] = useState('eye-off-outline');
    const [showPassword, setShowPassword] = useState(false);

    const imageClick = () => {
        console.log('đã nhấn vào đây');
        setShowPassword(!showPassword);
        setEyeName(!showPassword ? "eye-outline" : "eye-off-outline");
    }

    var eyeImgComponet = (eye) => {
        if (eye == true) {
            return (
                <TouchableOpacity onPress={() => { imageClick(); }} style={styles.inlineEndImg} >
                    <Icon name={eyeName} style={{ fontSize: 20, color: '#ABB4BD' }} />
                </TouchableOpacity>
            );
        } else {
            return null;
        }
    };

    return (
        <View style={styles.container} >
            <Icon name={name} style={styles.inlineStartImg} />
            <TextInput
                style={[styles.input]}
                placeholder={placeholder}
                secureTextEntry={secureText ? !showPassword : false}
                placeholderTextColor="gray"
                underlineColorAndroid="transparent"
                value={text}
                selectTextOnFocus={false}
                autoCorrect={false}
                autoCapitalize="none"
                {...otherProps}
            />
            {
                eyeImgComponet(eye)
            }
        </View>
    );

}

const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;
const TEXT_HEIGHT = 42;

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        width: DEVICE_WIDTH - TEXT_HEIGHT,
        height: TEXT_HEIGHT,
        borderColor: '#5c9fff',
        borderWidth: 1,
        borderRadius: 20,
        paddingLeft: 0,
        alignSelf: 'center',
        marginTop: 22,
    },
    inlineStartImg: {
        position: 'absolute',
        color: '#3366CC',
        zIndex: 99,
        width: 30,
        height: 30,
        left: 12,
        top: 8,
        fontSize: 20
    },
    input: {
        width: '100%',
        height: '100%',
        marginHorizontal: 0,
        paddingLeft: 45,
        paddingRight: 35,
        borderRadius: 20,
        color: 'black',
    },
    inlineEndImg: {
        position: 'absolute',
        zIndex: 99,
        width: 30,
        height: 30,
        right: 12,
        top: 8,
    },
});

export default TextImage;