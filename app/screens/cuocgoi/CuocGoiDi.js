import React, { useState, useEffect } from 'react';
import { Platform, StyleSheet, Text, View, TouchableOpacity, ScrollView, PermissionsAndroid } from 'react-native';
import uuid from 'uuid';
import RNCallKeep from 'react-native-callkeep';
import BackgroundTimer from 'react-native-background-timer';
import DeviceInfo from 'react-native-device-info';
import storeData from '../../hooks/storeData';
import keyStoreData from '../../utils/keyStoreData';
import { RTCPeerConnection, mediaDevices, RTCSessionDescription, } from 'react-native-webrtc';
import { getHub } from '../../hubmanager/HubManager';
import logSignalR from '../../utils/customLogSignalR';

var conn = getHub();

BackgroundTimer.start();
const configuration = {
    iceServers: [
        { url: 'stun:stun.voipbuster.com' },
        { url: 'stun:42.112.31.62:3478' },
        {
            url: 'turn:42.112.31.62:3478',
            username: 'lachong',
            credential: 'axy@789',
        },
    ],
};

var Januscandidates = new Array();
const webrtcConstraints = { audio: true, video: false };


const hitSlop = { top: 10, left: 10, right: 10, bottom: 10 };
const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: 20,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    button: {
        marginTop: 20,
        marginBottom: 20,
    },
    callButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 30,
        width: '100%',
    },
    logContainer: {
        flex: 3,
        width: '100%',
        backgroundColor: '#D9D9D9',
    },
    log: {
        fontSize: 10,
    }
});

RNCallKeep.setup({
    ios: {
        appName: 'CallKeepDemo',
    },
    android: {
        alertTitle: 'Permissions required',
        alertDescription: 'This application needs to access your phone accounts',
        cancelButton: 'Cancel',
        okButton: 'ok',

        //Add bổ xung giống bản của mr khánh
        additionalPermissions: [PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE],
        foregroundService: {
            channelId: 'com.lachong.toda',
            channelName: 'Foreground service for my app',
            notificationTitle: 'My app is running on background',
            notificationIcon: 'Path to the resource icon of the notification',
        },
    },
});

RNCallKeep.backToForeground();

const getNewUuid = () => uuid.v4().toLowerCase();

const format = uuid => uuid.split('-')[0];

const isIOS = Platform.OS === 'ios';

export default function DienThoai({ navigation, route }) {
    const [logText, setLog] = useState('');
    const [heldCalls, setHeldCalls] = useState({}); // callKeep uuid: held
    const [mutedCalls, setMutedCalls] = useState({}); // callKeep uuid: muted
    const [calls, setCalls] = useState({}); // callKeep uuid: number
    const [callUUIDHienTai, setCallUUIDHienTai] = useState();
    const [connectionRTC, setConnectionRTC] = useState(null);

    const { soDienThoai } = route.params ?? '';
    const { hoTen } = route.params;
    console.log(route.params);

    const resetState = () => {
        setCalls({});
        setLog('');
        setHeldCalls({});
        setMutedCalls({});
        setCallUUIDHienTai('');
        setConnectionRTC(null);

        navigation.navigate('BanPhim');
    }
    const log = (text) => {
        console.info(text);
        setLog(logText + "\n" + text);
    };

    const addCall = (callUUID, number) => {
        setHeldCalls({ ...heldCalls, [callUUID]: false });
        setCalls({ ...calls, [callUUID]: number });
    };

    const removeCall = (callUUID) => {
        const { [callUUID]: _, ...updated } = calls;
        const { [callUUID]: __, ...updatedHeldCalls } = heldCalls;

        setCalls(updated);
        setCalls(updatedHeldCalls);
    };

    const setCallHeld = (callUUID, held) => {
        setHeldCalls({ ...heldCalls, [callUUID]: held });
    };

    const setCallMuted = (callUUID, muted) => {
        setMutedCalls({ ...mutedCalls, [callUUID]: muted });
    };

    const startCall = async () => {
        const callUUID = getNewUuid();
        let number = await storeData.getStoreDataValue(keyStoreData.soDienThoai)
        setCallUUIDHienTai(callUUID);
        addCall(callUUID, number);
        let sessionCallId = await storeData.getStoreDataValue(keyStoreData.SessionCallId);
        BackgroundTimer.setTimeout(() => {
            outgoingCall(number, sessionCallId);
        }, 200);

        BackgroundTimer.setTimeout(() => {
            RNCallKeep.startCall(callUUID, number, hoTen);
        }, 500);

    }

    const answerCall = ({ callUUID }) => {
        const number = calls[callUUID];
        console.log('calls', calls);
        log(`[answerCall] ${format(callUUID)}, number: ${number}`);

        RNCallKeep.startCall(callUUID, number, number);

        BackgroundTimer.setTimeout(() => {
            log(`[setCurrentCallActive] ${format(callUUID)}, number: ${number}`);
            RNCallKeep.setCurrentCallActive(callUUID);
        }, 1000);
    };

    const didPerformDTMFAction = ({ callUUID, digits }) => {
        const number = calls[callUUID];
        log(`[didPerformDTMFAction] ${format(callUUID)}, number: ${number} (${digits})`);
    };

    const didReceiveStartCallAction = ({ handle }) => {
        if (!handle) {
            // @TODO: sometime we receive `didReceiveStartCallAction` with handle` undefined`
            return;
        }
        const callUUID = getNewUuid();
        addCall(callUUID, handle);

        log(`[didReceiveStartCallAction] ${callUUID}, number: ${handle}`);

        RNCallKeep.startCall(callUUID, handle, handle);

        BackgroundTimer.setTimeout(() => {
            log(`[setCurrentCallActive] ${format(callUUID)}, number: ${handle}`);
            RNCallKeep.setCurrentCallActive(callUUID);
        }, 1000);
    };

    const didPerformSetMutedCallAction = ({ muted, callUUID }) => {
        const number = calls[callUUID];
        log(`[didPerformSetMutedCallAction] ${format(callUUID)}, number: ${number} (${muted})`);

        setCallMuted(callUUID, muted);
    };

    const didToggleHoldCallAction = ({ hold, callUUID }) => {
        const number = calls[callUUID];
        log(`[didToggleHoldCallAction] ${format(callUUID)}, number: ${number} (${hold})`);

        setCallHeld(callUUID, hold);
    };

    const endCall = async ({ callUUID }) => {
        const handle = calls[callUUID];
        log(`[endCall] ${format(callUUID)}, number: ${handle}`);
        let sessionCallId = await storeData.getStoreDataValue(keyStoreData.SessionCallId);
        conn.invoke('hangUp', sessionCallId).catch((error) => console.log(error));
        removeCall(callUUID);
        resetState();
    };

    const hangup = async (callUUID) => {
        RNCallKeep.endCall(callUUID);
        let sessionCallId = await storeData.getStoreDataValue(keyStoreData.SessionCallId);
        conn.invoke('hangUp', sessionCallId).catch((error) => console.log(error));
        removeCall(callUUID);
        resetState();
    };

    const setOnHold = (callUUID, held) => {
        const handle = calls[callUUID];
        RNCallKeep.setOnHold(callUUID, held);
        log(`[setOnHold: ${held}] ${format(callUUID)}, number: ${handle}`);

        setCallHeld(callUUID, held);
    };

    const setOnMute = (callUUID, muted) => {
        const handle = calls[callUUID];
        RNCallKeep.setMutedCall(callUUID, muted);
        log(`[setMutedCall: ${muted}] ${format(callUUID)}, number: ${handle}`);

        setCallMuted(callUUID, muted);
    };

    const updateDisplay = (callUUID) => {
        const number = calls[callUUID];
        // Workaround because Android doesn't display well displayName, se we have to switch ...
        if (isIOS) {
            RNCallKeep.updateDisplay(callUUID, 'New Name', number);
        } else {
            RNCallKeep.updateDisplay(callUUID, number, 'New Name');
        }

        log(`[updateDisplay: ${number}] ${format(callUUID)}`);
    };

    /// Handle SignalR //////////////////////////////////

    const callbackIceCandidateJanus = (evt, callid) => {
        if (evt.candidate) {
            //Found a new candidate
            Januscandidates.push(JSON.stringify({ candidate: evt.candidate }));
        } else {
            try {
                logSignalR.clientCallServer('SendCandidate');
                conn.invoke('SendCandidate', Januscandidates, callid);
            } catch (error) {
                console.log('Call server Error callbackIceCandidateJanus Error: ', error);
            }
            Januscandidates = new Array();
        }
    };

    const callbackIceCandidateJanusState = (evt) => {
        if (evt) {
            //Found a new candidate
            console.log(evt);
        }
    };
    const callbackIceCandidateJanusError = (err) => {
        if (err) {
            console.log(err);
        }
    };

    const outgoingCall = async (number, sessionCall) => {

        let stream = await mediaDevices.getUserMedia(webrtcConstraints);
        var connection = new RTCPeerConnection(configuration);

        connection.onicecandidate = (evt) => callbackIceCandidateJanus(evt, sessionCall); // ICE Candidate Callback
        connection.onicecandidateerror = (error) => callbackIceCandidateJanusError(error);
        connection.oniceconnectionstatechange = (evt) => callbackIceCandidateJanusState(evt);
        connection.addStream(stream);
        let offer = await connection.createOffer();
        connection.setLocalDescription(offer)
            .then(() => {
                try {
                    conn.invoke('CallAsterisk', number, connection.localDescription.sdp, sessionCall);
                    setConnectionRTC(connection);
                } catch (error) {
                    console.log('CallAsterisk Error call out', error);
                }
            })
            .catch(error)
        {
            console.log('CallAsterisk Error setLocalDescription', error);
        }
    }


    const newSignal = (data) => {
        var signal = JSON.parse(data);
        // Route signal based on type
        if (signal.sdp) {
            if (connectionRTC)
                connectionRTC
                    .setRemoteDescription(new RTCSessionDescription(signal.sdp))
                    .then(() => { console.log('Et thành công setRemoteDescription') })
                    .catch((err) =>
                        console.log('WebRTC: Error while setting remote description', err),
                    );
        }
    };

    conn.off('Calling')
    conn.on("Calling", (callid, msg, id) => {
        logSignalR.serverCallClient('Calling');
        try {
            conn.invoke("ConfirmEvent", "Calling");
        } catch (error) {
            logSignalR.clientCallServerError('Calling', error);
        }
        console.log("Calling Home: ", callid)
        DataClient.saveData('IncomingCallID', callid);
    })

    conn.off('receiveSignal')
    conn.on('receiveSignal', (signal, id) => {
        logSignalR.serverCallClient('receiveSignal');
        try {
            conn.invoke("ConfirmEvent", "receiveSignal");

        } catch (error) {
            logSignalR.clientCallServerError('receiveSignal', error);
        }
        // Server trả về SDP cấu hình RTCSessionDescription qua sdp này cho người gọi đi
        newSignal(signal);
    });

    conn.off('Ringing')
    conn.on('Ringing', (id) => {
        logSignalR.serverCallClient('Ringing');
        try {
            conn.invoke("ConfirmEvent", "Ringing");

        } catch (error) {
            logSignalR.clientCallServerError('Ringing', error);
        }
        // Server trả về SDP cấu hình RTCSessionDescription qua sdp này cho người gọi đi
    });

    conn.off('callAccepted')
    conn.on('callAccepted', (id) => {

        logSignalR.serverCallClient('callAccepted');
        var date0 = new Date();
        var ngay0 = date0.getDate().toString() + '/' + (date0.getMonth() + 1).toString() + '/' + date0.getFullYear().toString();
        var gio0 = date0.getHours().toString() + ':' + date0.getMinutes().toString() + ':' + date0.getSeconds().toString();
        var time = ngay0 + " " + gio0
        storeData.setStoreDataValue('timeStartCall', time)

        try {
            conn.invoke("ConfirmEvent", "callAccepted");

        } catch (error) {
            logSignalR.clientCallServerError('callAccepted', error);
        }

        RNCallKeep.setCurrentCallActive(callUUIDHienTai);

        // RNCallKeep.updateDisplay(this.state.callid, displayName, handle)
    });

    conn.off('callDeclined')
    conn.on('callDeclined', (callid, code, reason, id) => {
        logSignalR.serverCallClient('callEnded');
        resetState();
        RNCallKeep.endCall(callUUIDHienTai);
    });

    conn.off('callEnded')
    conn.on('callEnded', (callid, code, reason, id) => {
        logSignalR.serverCallClient('callEnded');
        resetState();
        RNCallKeep.endCall(callUUIDHienTai);
    });

    ////////// End handle SignalR ////////////////////// 

    React.useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            startCall();
        });

        return unsubscribe;
    }, [navigation]);

    useEffect(() => {

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
    }, [soDienThoai]);

    if (isIOS && DeviceInfo.isEmulator()) {
        return <Text style={styles.container}>CallKeep doesn't work on iOS emulator</Text>;
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.button} hitSlop={hitSlop}>
                <Text>Display incoming call now</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} hitSlop={hitSlop}>
                <Text>Display incoming call now in 3s</Text>
            </TouchableOpacity>

            {Object.keys(calls).map(callUUID => (
                <View key={callUUID} style={styles.callButtons}>
                    <TouchableOpacity
                        onPress={() => setOnHold(callUUID, !heldCalls[callUUID])}
                        style={styles.button}
                        hitSlop={hitSlop}
                    >
                        <Text>{heldCalls[callUUID] ? 'Unhold' : 'Hold'} {calls[callUUID]}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => updateDisplay(callUUID)}
                        style={styles.button}
                        hitSlop={hitSlop}
                    >
                        <Text>Update display</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setOnMute(callUUID, !mutedCalls[callUUID])}
                        style={styles.button}
                        hitSlop={hitSlop}
                    >
                        <Text>{mutedCalls[callUUID] ? 'Unmute' : 'Mute'} {calls[callUUID]}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => hangup(callUUID)} style={styles.button} hitSlop={hitSlop}>
                        <Text>Hangup {calls[callUUID]}</Text>
                    </TouchableOpacity>
                </View>
            ))}

            <ScrollView style={styles.logContainer}>
                <Text style={styles.log}>
                    {logText}
                </Text>
            </ScrollView>
        </View>
    );
}