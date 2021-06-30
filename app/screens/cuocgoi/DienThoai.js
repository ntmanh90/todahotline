
import React, { useState, useEffect } from 'react';
import {
    Platform, StyleSheet, Text, View, PermissionsAndroid,

} from 'react-native';
import uuid from 'uuid';
import RNCallKeep from 'react-native-callkeep';
import BackgroundTimer from 'react-native-background-timer';
import DeviceInfo from 'react-native-device-info';

BackgroundTimer.start();

RNCallKeep.setup({
    ios: {
        appName: 'todahotline',
    },
    android: {
        alertTitle: 'Permissions required',
        alertDescription: 'This application needs to access your phone accounts',
        cancelButton: 'Cancel',
        okButton: 'ok',
        additionalPermissions: [PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE],
        foregroundService: {
            channelId: 'com.lachong.toda',
            channelName: 'Foreground service for my app',
            notificationTitle: 'My app is running on background',
            notificationIcon: 'Path to the resource icon of the notification',
        },
        //selfManaged: true,
    }
});

const getNewUuid = () => uuid.v4().toLowerCase();

const format = uuid => uuid.split('-')[0];

const isIOS = Platform.OS === 'ios';

const DienThoai = ({ navigation, route }) => {
    const sdt = route.params ?? '';
    const inCall = route.inCall ?? 0; // 1: cuộc gọi vào, 2: cuộc gọi ra
    const hoten = route.params ?? '';

    const log = (text) => {
        console.info(text);
    };

    const displayIncomingCall = (number, name) => {
        const callUUID = getNewUuid();

        log(`[displayIncomingCall] ${format(callUUID)}, number: ${number}`);

        RNCallKeep.displayIncomingCall(callUUID, number, name, 'number');
    };

    const answerCall = ({ callUUID, number, name }) => {
        const number = callUUID; //calls[callUUID];
        log(`[answerCall] ${format(callUUID)}, number: ${number}`);

        RNCallKeep.startCall(callUUID, number, name);

        BackgroundTimer.setTimeout(() => {
            log(`[setCurrentCallActive] ${format(callUUID)}, number: ${number}`);

            RNCallKeep.setCurrentCallActive(callUUID);
        }, 1000);
    };

    const didPerformDTMFAction = ({ callUUID, digits }) => {
        const number = callUUID; // calls[callUUID];
        log(`[didPerformDTMFAction] ${format(callUUID)}, number: ${number} (${digits})`);
    };

    const didReceiveStartCallAction = ({ handle }) => {
        if (!handle) {
            // @TODO: sometime we receive `didReceiveStartCallAction` with handle` undefined`
            return;
        }
        const callUUID = getNewUuid();

        log(`[didReceiveStartCallAction] ${callUUID}, number: ${handle}`);

        RNCallKeep.startCall(callUUID, handle, handle);

        BackgroundTimer.setTimeout(() => {
            log(`[setCurrentCallActive] ${format(callUUID)}, number: ${handle}`);
            RNCallKeep.setCurrentCallActive(callUUID);
        }, 1000);
    };

    const didPerformSetMutedCallAction = ({ muted, callUUID }) => {
        const number = callUUID; //calls[callUUID];
        log(`[didPerformSetMutedCallAction] ${format(callUUID)}, number: ${number} (${muted})`);
    };

    const didToggleHoldCallAction = ({ hold, callUUID }) => {
        const number = callUUID; //calls[callUUID];
        log(`[didToggleHoldCallAction] ${format(callUUID)}, number: ${number} (${hold})`);
    };

    const endCall = ({ callUUID }) => {
        const handle = callUUID; //calls[callUUID];
        log(`[endCall] ${format(callUUID)}, number: ${handle}`);
    };

    const hangup = (callUUID) => {
        RNCallKeep.endCall(callUUID);
    };

    const setOnHold = (callUUID, held) => {
        const handle = callUUID; //calls[callUUID];
        RNCallKeep.setOnHold(callUUID, held);
        log(`[setOnHold: ${held}] ${format(callUUID)}, number: ${handle}`);
    };

    const setOnMute = (callUUID, muted) => {
        const handle = callUUID; //calls[callUUID];
        RNCallKeep.setMutedCall(callUUID, muted);
        log(`[setMutedCall: ${muted}] ${format(callUUID)}, number: ${handle}`);
    };

    const updateDisplay = (callUUID) => {
        //Sử dụng tính năng này để cập nhật màn hình sau khi cuộc gọi đi bắt đầu.
        const number = callUUID; // calls[callUUID];
        // Workaround because Android doesn't display well displayName, se we have to switch ...
        if (isIOS) {
            RNCallKeep.updateDisplay(callUUID, 'New Name', number);
        } else {
            RNCallKeep.updateDisplay(callUUID, number, 'New Name');
        }

        log(`[updateDisplay: ${number}] ${format(callUUID)}`);
    };

    useEffect(() => {
        if (sdt !== '') {
            displayIncomingCall(sdt, hoten);
        }
        RNCallKeep.addEventListener('answerCall', answerCall);
        RNCallKeep.addEventListener('didPerformDTMFAction', didPerformDTMFAction);
        RNCallKeep.addEventListener('didReceiveStartCallAction', didReceiveStartCallAction);
        RNCallKeep.addEventListener('didPerformSetMutedCallAction', didPerformSetMutedCallAction);
        RNCallKeep.addEventListener('didToggleHoldCallAction', didToggleHoldCallAction);
        RNCallKeep.addEventListener('endCall', endCall);

        return () => {
            RNCallKeep.removeEventListener('answerCall', answerCall);
            RNCallKeep.removeEventListener('didPerformDTMFAction', didPerformDTMFAction);
            RNCallKeep.removeEventListener('didReceiveStartCallAction', didReceiveStartCallAction);
            RNCallKeep.removeEventListener('didPerformSetMutedCallAction', didPerformSetMutedCallAction);
            RNCallKeep.removeEventListener('didToggleHoldCallAction', didToggleHoldCallAction);
            RNCallKeep.removeEventListener('endCall', endCall);
        }
    }, [sdt]);

    if (isIOS && DeviceInfo.isEmulator()) {
        return <Text style={styles.container}>Error Ios</Text>;
    }

    return (
        <View style={styles.container}>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: 20,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default DienThoai;
