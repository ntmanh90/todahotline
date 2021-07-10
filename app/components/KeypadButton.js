import React from 'react';
import { TouchableOpacity, StyleSheet, View, Text } from 'react-native';

function KeypadButton({ txt1, txt2, styleCss, onPress, ...otherProps }) {

    return (
        <TouchableOpacity
            onPress={onPress}
        >
            <View {...otherProps}>
                <View style={[styleCss, styles.view]}>
                    <Text style={styles.digits}>
                        {txt1}
                    </Text>
                    {txt2 !== '' ?
                        (<Text style={[styles.letters, { alignSelf: "center" }]}>
                            {txt2}
                        </Text>) : null}
                </View>
            </View>
        </TouchableOpacity>
    );
}

var styles = StyleSheet.create({
    view: {
        flexDirection: "column",
    },
    digits: {
        fontFamily: "Helvetica Neue",
        fontSize: 36,
        alignSelf: "center"
    },
    letters: {
        fontFamily: "Helvetica Neue",
        marginTop: -5,
        fontSize: 8
    }
});

export default KeypadButton;