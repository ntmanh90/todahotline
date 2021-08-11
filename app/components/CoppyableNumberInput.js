import React, { useState, useEffect } from 'react';
import {
    TouchableOpacity,
    Dimensions,
    Modal,
    StyleSheet,
    View,
    TouchableHighlight,
    Button,
    Text
} from 'react-native';
import Clipboard from '@react-native-community/clipboard';
import Tooltip from 'react-native-walkthrough-tooltip';


export default function Coppyable({ onCopy, phoneNumber }) {

    const [toolTipVisible, setToolTipVisible] = useState(false);


    return (
        <View style={styles.row}>
            <Tooltip
                isVisible={toolTipVisible}
                content={
                    <TouchableOpacity onPress={(e) => onCopy()}>
                        <Text>Dán</Text>
                    </TouchableOpacity>
                }

                placement="right"
                onClose={() => setToolTipVisible(false)}>
                <TouchableOpacity
                    style={{ minWidth: 100 }}
                    onLongPress={() => setToolTipVisible(true)}>
                    <Text style={{ fontSize: 30, maxHeight: 40, alignSelf: 'center' }}>
                        {phoneNumber}
                    </Text>
                </TouchableOpacity>
            </Tooltip>
        </View>
    );

}

var styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 15,
        marginLeft: 10,
        marginRight: 10,
    },
});
