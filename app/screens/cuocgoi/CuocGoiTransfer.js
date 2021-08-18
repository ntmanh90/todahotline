import React, { useState, useEffect } from 'react';
import { ImageBackground, Platform, StyleSheet, Text, View, TouchableOpacity, Modal, Dimensions } from 'react-native';
import BackgroundTimer from 'react-native-background-timer';
import { Icon } from 'react-native-elements';
import storeData from '../../hooks/storeData';
import keyStoreData from '../../utils/keyStoreData';
import { RTCPeerConnection, mediaDevices, RTCSessionDescription, } from 'react-native-webrtc';
import { getHubAndReconnect, AddEvent, RemoveEvent, eventAccepted, eventCalling, eventRinging, eventSignal, eventDeclined, eventEnded } from '../../hubmanager/HubManager';
import logSignalR from '../../utils/customLogSignalR';
import logData from '../../utils/logData';
import CuocgoiDB from '../../database/CuocGoiDB';
import RNCallKeep from 'react-native-callkeep';
import CallTypeEnum from '../../hubmanager/CallTypeEnum';
import statusCallEnum from '../../utils/statusCallEnum';
import { useNavigation } from '@react-navigation/native';
import Calltimer from '../../components/Calltimer';
import PopUpDialerScreeen from './PopUpDialerScreeen';
import TransferScreen from './TransferScreen';
import showUICallEnum from '../../utils/showUICallEnum';
import NetInfo from "@react-native-community/netinfo";
import InCallManager from 'react-native-incall-manager';
import Toast from 'react-native-simple-toast';

const widthScreen = Dimensions.get('window').width;
const heightScreen = Dimensions.get('window').height;

var conn = getHubAndReconnect();
var bitratePrew = 0;
var connectionRTC = null;
var stremRTC = null;
var coutTinHieuYeu = 0;
var subSessionCall = '';

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

const isIOS = Platform.OS === 'ios';

function CuocGoiTransfer({ route }) {
    const [isTransfer, setIsTransfer] = useState(false);
    const [isDTMF, setIsDTMF] = useState(false);
    const [isCall, setIsCall] = useState(true);
    const [isHold, setIsHold] = useState(false);
    const [timeStart, setTimeStart] = useState(new Date());
    const [statusCall, setStatusCall] = useState(statusCallEnum.DangKetNoi);
    const [txtStatusCall, setTxtStatusCall] = useState('');
    const [bitrate, setBitrate] = useState('');
    const [isMute, setIsMute] = useState(false);
    const [isSpeaker, setIsSpeaker] = useState(false);
    const [interValBitRate, setInterValBitRate] = useState(0);
    const [showUI, setShowUI] = useState(1);
    const [visibleModel, setVisibleModel] = useState(true);

    const navigation = useNavigation();

    let phonenumber = route.params.subCallNumber ?? '';
    let callName = route.params.subCallName ?? '';

    const resetState = () => {
        BackgroundTimer.setTimeout(() => {
            if (interValBitRate != 0)
                BackgroundTimer.clearInterval(interValBitRate);

            setIsHold(false);
            setBitrate('');
            setStatusCall(statusCallEnum.DangKetNoi);
            setIsMute(false);
            setIsSpeaker(false);
            setTxtStatusCall('');
            subSessionCall = '';
            connectionRTC = null;
            stremRTC = null;
            coutTinHieuYeu = 0;

            setTimeStart(new Date());
            handleShowUI();
            setVisibleModel(false);
            navigation.goBack();
        }, 1000);

    }

    const onStartCall = async (so_dien_thoai, ho_ten) => {
        InCallManager.setSpeakerphoneOn(false);
        conn = getHubAndReconnect();
        console.log('[subSessionCall]', subSessionCall);
        outgoingCall(so_dien_thoai, subSessionCall);

        CuocgoiDB.addCuocGoi(so_dien_thoai, CallTypeEnum.OutboundCall);
        //Hiển thị màn hình cuộc gọi nhưng chưa đếm giây
    }


    /// Handle SignalR //////////////////////////////////
    const callbackIceCandidateJanus = (evt, callid) => {
        conn = getHubAndReconnect();
        if (evt.candidate) {
            //Found a new candidate
            Januscandidates.push(JSON.stringify({ candidate: evt.candidate }));
        } else {
            try {
                conn.invoke('SendCandidate', Januscandidates, callid).then(() => {
                    console.log('invoke: SendCandidate cuộc gọi đi ' + phonenumber.toString());
                    logData.writeLogData('invoke: SendCandidate cuộc gọi đi' + phonenumber.toString())
                });
            } catch (error) {
                console.log('----Call server Error callbackIceCandidateJanus Error: ', error);
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
        conn = getHubAndReconnect();
        console.log('[param sub call]', number, sessionCall);
        let stream = await mediaDevices.getUserMedia(webrtcConstraints);
        stremRTC = stream;
        var connection = new RTCPeerConnection(configuration);
        console.log('[connection sub call]', connection);
        connection.onicecandidate = (evt) => callbackIceCandidateJanus(evt, sessionCall); // ICE Candidate Callback
        connection.onicecandidateerror = (error) => callbackIceCandidateJanusError(error);
        connection.oniceconnectionstatechange = (evt) => callbackIceCandidateJanusState(evt);
        connection.addStream(stream);
        let offer = await connection.createOffer();
        let descriptionType = await connection.setLocalDescription(offer);

        try {
            conn.invoke('CallAsterisk', number, connection.localDescription.sdp, sessionCall).then(() => {
                logData.writeLogData('invoke: CallAsterisk cuộc gọi đi ' + number);
            });
            connectionRTC = connection;
            setStatusCall(statusCallEnum.DangKetNoi);
            // setconsole.log('----connection', connection);
        } catch {
            console.log('----CallAsterisk Error call out');
        }
    }

    const getTinHieu = async () => {
        if (connectionRTC) {
            connectionRTC.getStats(null).then(stats => {
                stats.forEach(report => {
                    if (report.type === 'inbound-rtp' && report.mediaType === 'audio') {
                        const bitrate = report.bytesReceived;
                        //console.log('[bitrate]: ', bitrate);
                        if (bitrate - bitratePrew <= 0) {
                            //kết nối yếu

                            setBitrate('Tín hiệu yếu');
                            coutTinHieuYeu = coutTinHieuYeu + 1;
                            //console.log('[Tín hiệu yếu]', coutTinHieuYeu);
                            if (coutTinHieuYeu % 5 == 0) {
                                onUpdateCall();
                            }
                            if (coutTinHieuYeu >= 25) {
                                //handleEndCallTinHieuYeu();
                            }
                        }
                        else {
                            //kết nối tốt
                            coutTinHieuYeu = 0;
                            setBitrate('Tín hiệu tốt');
                        }

                        bitratePrew = bitrate;
                    }
                });
            });
        }
    }

    const newSignal = (data) => {
        console.log('[connectionRTC new Signal]');

        var signal = JSON.parse(data);
        // Route signal based on type
        if (signal.sdp) {
            if (connectionRTC) {
                try {
                    connectionRTC
                        .setRemoteDescription(new RTCSessionDescription(signal.sdp))
                        .then(() => { console.log('Et thành công setRemoteDescription') });
                }
                catch (error) {
                    logData.writeLogData('WebRTC: Error while setting remote description');
                    console.log('WebRTC: Error while setting remote description');
                }
            }
        };
    }

    ////////// End handle SignalR ////////////////////// 


    /// Xử lý event liên quan đến nút bấm UI ///

    const CallStatus = () => {
        console.log('statusCall: ', statusCall);
        if (statusCall == statusCallEnum.DaKetNoi) {
            if (isHold) {
                setTxtStatusCall('Đang giữ');
            }
            else
                setTxtStatusCall(' Đã kết nối');
        }
        else if (statusCall == statusCallEnum.DangKetNoi) {
            setTxtStatusCall(' Đang kết nối...');
        }
        else if (statusCall == statusCallEnum.DoChuong) {
            setTxtStatusCall(' Đang đổ chuông...');
        }
        else {
            setTxtStatusCall(' Cuộc gọi kết thúc');
        }
    }

    const onHold = async (value, isclick) => {
        console.log('[isHold]', value, isclick, isHold);
        if (isclick == 1) {
            setIsHold(value);
        }

        if (value) {
            try {
                conn = getHubAndReconnect();
                conn.invoke("Hold", subSessionCall);
            } catch {
                logData.writeLogData('Error invoke Hold');
            }
        }
        else {
            if (isclick == 1) {
                try {
                    conn.invoke("UnHold", subSessionCall);
                } catch {
                    logData.writeLogData('Error invoke UnHold');
                }
            }
            else {
                if (isHold == false) {
                    try {
                        conn.invoke("UnHold", subSessionCall);
                    } catch {
                        logData.writeLogData('Error invoke UnHold');
                    }
                }
            }
        }

        return;
    };

    const startRingtone = () => {
        InCallManager.startRingtone('_DEFAULT_');
    }

    const stopRingtone = () => {
        InCallManager.stopRingtone();
    }

    const startCall = () => {
        InCallManager.start({ media: 'audio', ringback: '_BUNDLE_' });
    }
    const stopCall = () => {
        InCallManager.stop({ busytone: '_DEFAULT_' });
    }
    const onSpeaker = () => {
        console.log("onSpeaker: ", !isSpeaker)
        InCallManager.setSpeakerphoneOn(!isSpeaker);
        setIsSpeaker(!isSpeaker);
    }
    const onMute = () => {
        setIsMute(!isMute);
        console.log("onMute: ", !isMute)
        stremRTC.getAudioTracks()[0].enabled = !isMute
    }


    const onHangUp = async () => {
        BackgroundTimer.clearInterval(interValBitRate);
        conn = getHubAndReconnect();
        console.log('hangUp');
        //conn.invoke('hangUp', subSessionCall).catch((error) => console.log(error));
        conn.invoke("RemoveSubCall", subSessionCall)
        setStatusCall(statusCallEnum.DaKetThuc);
        if (coutTinHieuYeu > 2 && coutTinHieuYeu < 25) {
            useSendMissCallHook.request(phonenumber, statusMissCallType.KetNoiYeuDTVKetThuc);
        }

        resetState();

        Toast.showWithGravity('Kết thúc cuộc gọi.', Toast.LONG, Toast.BOTTOM);
    };

    const onDTMF = (dialString) => {
        console.log('[dialString]', dialString);
        if (connectionRTC != null) {
            connectionRTC.sendDtmfTone(dialString).then((json) => {
                console.log("onDTMF: ", json)
            }).catch();
        }
    }

    const onUpdateCall = async () => {
        connectionRTC.createOffer({ iceRestart: true }).then((offer) => {
            connectionRTC.setLocalDescription(offer)
                .then(() => {
                    conn.invoke("UpdateOffer", connectionRTC.localDescription.sdp, subSessionCall);
                })
                .catch();
        }).catch();
    }

    /// end xử lý nút bấm UI ///

    //RN Call Keep

    const didPerformDTMFAction = ({ callUUID, digits }) => {
        //Gọi hàm xử lý sự kiện bấm số khi dùng UI call mặc định
    };

    const didPerformSetMutedCallAction = async ({ muted, callUUID }) => {
        //Gọi hàm xử lý sự kiện mute 
        //setIsMute(muted);
        RNCallKeep.setMutedCall(callUUID, muted);
    };

    const didToggleHoldCallAction = async ({ hold, callUUID }) => {
        //Họi hàm xử lý sự kiện hold

    };

    const AddEventSubCall = () => {
        AddEvent(subSessionCall, eventCalling, (callid, msg, id) => {
            console.log("MainCall Calling");
            logSignalR.serverCallClient('Calling');
            logData.writeLogData('server call client: Calling, callid: ' + JSON.stringify(callid));
            try {
                conn.invoke("ConfirmEvent", "Calling", callid);
            } catch (error) {
                logSignalR.clientCallServerError('Calling', error);
            }
            console.log("Calling Home: ", callid);
        })
    
        AddEvent(subSessionCall, eventSignal, (signal, id) => {
            logSignalR.serverCallClient('receiveSignal receiveSignal CuocGoi ');
                logData.writeLogData('server call client: receiveSignal CuocGoi ');
                try {
                    conn.invoke("ConfirmEvent", "receiveSignal", null);
    
                } catch (error) {
                    logSignalR.clientCallServerError('receiveSignal', error);
                }
                // Server trả về SDP cấu hình RTCSessionDescription qua sdp này cho người gọi đi
                newSignal(signal);
        })
    
        AddEvent(subSessionCall, eventRinging, (id) => {
            setStatusCall(statusCallEnum.DoChuong);
            logSignalR.serverCallClient('Ringing');
            logData.writeLogData('server call client: Ringing');
            try {
                conn.invoke("ConfirmEvent", "Ringing", null);
    
            } catch (error) {
                logSignalR.clientCallServerError('Ringing', error);
            }
            // Server trả về SDP cấu hình RTCSessionDescription qua sdp này cho người gọi đi
        });
    
        AddEvent(subSessionCall, eventAccepted, (id) => {
            setTimeStart(new Date());
    
            logData.writeLogData('Server call client: callAccepted');
            logSignalR.serverCallClient('callAccepted');
            setStatusCall(statusCallEnum.DaKetNoi);
            try {
                conn.invoke("ConfirmEvent", "callAccepted", null);
            } catch (error) {
                logSignalR.clientCallServerError('callAccepted', error);
            }
        });
    
        AddEvent(subSessionCall , eventDeclined, (callid, code, reason, id) => {
            conn.invoke("ConfirmEvent", "callDeclined", callid).catch((error) => console.log(error));
    
            logData.writeLogData('Server call client: callDeclined');
            logSignalR.serverCallClient('callEnded');
            RNCallKeep.endAllCalls();
            setStatusCall(statusCallEnum.DaKetThuc);
            resetState();
            Toast.showWithGravity(reason, Toast.LONG, Toast.BOTTOM);
        });
    
        AddEvent(subSessionCall, eventEnded , (callid, code, reason, id) => {
            conn.invoke("ConfirmEvent", "callEnded", callid).catch((error) => console.log(error));
    
            logData.writeLogData('Server call client: callEnded');
            logSignalR.serverCallClient('callEnded');
            setStatusCall(statusCallEnum.DaKetThuc);
            RNCallKeep.endAllCalls();
            resetState();
            Toast.showWithGravity(reason, Toast.LONG, Toast.BOTTOM);
        });
    }

    //End RN Call Keep

    const handleShowUI = () => {
        if (showUI == showUICallEnum.UITransfer) {
            onHold(true, 0).then(() => {
                setIsCall(false);
                setIsTransfer(true);
                setIsDTMF(false);
            });

        }
        else if (showUI == showUICallEnum.UIDialer) {
            setIsCall(false);
            setIsTransfer(false);
            setIsDTMF(true);
        }
        else {
            setIsCall(true);
            setIsTransfer(false);
            setIsDTMF(false);
        }
    }

    const loadParams = async () => {
        if (phonenumber == 'unsubscribe') {
            navigation.goBack();
        }
        conn.invoke('SubCall')
    }

    React.useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            setVisibleModel(true);
            setTimeStart(new Date());
            loadParams();

            return () => {
                unsubscribe;
            }
        });
    }, [navigation]);

    useEffect(() => {
        CallStatus();
        console.log('[statusCall]: ', statusCall);
        if (statusCall == statusCallEnum.DaKetNoi) {
            if (interValBitRate != 0)
                BackgroundTimer.clearInterval(interValBitRate);

            let interVal = BackgroundTimer.setInterval(() => {
                getTinHieu();
            }, 1000);
            console.log('[interVal]', interVal);
            setInterValBitRate(interVal);
        }
    }, [statusCall]);

    useEffect(() => {
        handleShowUI();
    }, [showUI]);

    useEffect(() => {
        conn.off('ReceivedSubCallId')
        conn.on('ReceivedSubCallId', (subcall_sessionid) => {
                conn.invoke("ConfirmEvent", "ReceivedSubCallId", null).catch((error) => console.log(error));
                subSessionCall = subcall_sessionid;
                onStartCall(phonenumber, callName);
                AddEventSubCall();
            });

        RNCallKeep.addEventListener('didPerformDTMFAction', didPerformDTMFAction);
        RNCallKeep.addEventListener('didPerformSetMutedCallAction', didPerformSetMutedCallAction);
        RNCallKeep.addEventListener('didToggleHoldCallAction', didToggleHoldCallAction);

        return () => {
            RemoveEvent(subSessionCall);
            RNCallKeep.removeEventListener('didPerformDTMFAction', didPerformDTMFAction);
            RNCallKeep.removeEventListener('didPerformSetMutedCallAction', didPerformSetMutedCallAction);
            RNCallKeep.removeEventListener('didToggleHoldCallAction', didToggleHoldCallAction);
        }
    }, []);

    return (
        <Modal style={{ height: heightScreen, width: widthScreen }}
            animationType="fade"
            transparent={true}
            visible={visibleModel}
            onRequestClose={() => {
                console.log('[visibleModel]', visibleModel);
            }}>
            {
                isTransfer === true &&
                (
                    <View style={{ flex: 1 }}>
                        <TransferScreen numberIncoming={phonenumber} hideTransfer={() => { setShowUI(showUICallEnum.UICall); }}></TransferScreen>
                    </View>
                )
            }

            {
                isDTMF === true && (
                    <View style={{ flex: 1 }}>
                        <PopUpDialerScreeen hideDialer={() => {
                            setShowUI(showUICallEnum.UICall);
                        }}
                            dtmf={(numberDialer) => onDTMF(numberDialer)}
                        />
                    </View>
                )
            }

            {
                isCall === true && (
                    <View style={{ flex: 1 }}>
                        <ImageBackground
                            source={require('../../Toda_Images/Dark_Gray.png')}
                            style={[styles.container, styles.image]}>
                            <View
                                style={{ width: '100%', flexDirection: 'column', flex: 1 }}>
                                <View style={{ alignContent: 'center', justifyContent: 'center', flex: 2 }}>
                                    <Text
                                        style={{
                                            color: '#fff',
                                            alignSelf: 'center',
                                            marginTop: 15,
                                            fontWeight: 'bold',
                                            fontSize: 32,
                                        }}>
                                        {callName}
                                    </Text>
                                    <Text
                                        style={{
                                            color: '#fff',
                                            alignSelf: 'center',
                                            marginTop: 5,
                                            fontSize: 26,
                                        }}>
                                        {phonenumber}
                                    </Text>
                                </View>
                                <View style={{ flex: 1, alignContent: 'center', justifyContent: 'center' }}>
                                    {
                                        isHold !== true && statusCall == statusCallEnum.DaKetNoi ?

                                            (
                                                <Calltimer TimeDuration={timeStart} />
                                            )
                                            :
                                            (
                                                <Text
                                                    style={{
                                                        color: '#fff',
                                                        alignSelf: 'center',
                                                        marginTop: 5,
                                                        fontSize: 25,
                                                    }}>
                                                    {txtStatusCall}
                                                </Text>
                                            )
                                    }

                                    {
                                        statusCall === statusCallEnum.DaKetNoi ?
                                            (
                                                <Text
                                                    style={{
                                                        color: '#fff',
                                                        alignSelf: 'center',
                                                        marginTop: 10,
                                                        fontSize: 18,
                                                    }}>
                                                    {bitrate}
                                                </Text>
                                            )

                                            : null
                                    }

                                </View>
                                <View style={{ flex: 4, alignContent: 'center', justifyContent: 'center' }}>
                                    <View style={{ flexDirection: 'row', flexGrow: 3, marginTop: 55, marginHorizontal: 20, justifyContent: 'space-around' }}>
                                        <TouchableOpacity onPress={() => {
                                            onMute();
                                        }}>
                                            {isMute ?
                                                <View>
                                                    <Icon
                                                        type="feather"
                                                        name="mic-off"
                                                        iconStyle={{ color: '#fff', fontSize: 27, alignSelf: 'center' }}
                                                    />
                                                    <Text
                                                        style={{
                                                            color: '#fff',
                                                            alignSelf: 'center',
                                                            marginTop: 5,
                                                        }}>
                                                        {"Tắt tiếng"}
                                                    </Text>
                                                </View>
                                                :
                                                <View>
                                                    <Icon
                                                        type="feather"
                                                        name="mic"
                                                        iconStyle={{ color: '#fff', fontSize: 27, alignSelf: 'center' }}
                                                    />

                                                    <Text
                                                        style={{
                                                            color: '#fff',
                                                            alignSelf: 'center',
                                                            marginTop: 5,
                                                        }}>
                                                        {"Tắt tiếng"}
                                                    </Text>
                                                </View>
                                            }

                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => {
                                            onSpeaker();
                                        }}>
                                            {isSpeaker ?
                                                <View>
                                                    <Icon
                                                        type="ionicon"
                                                        name="ios-volume-high"
                                                        iconStyle={{
                                                            color: '#FBFBFB',
                                                            fontSize: 27,
                                                            alignSelf: 'center',
                                                        }}
                                                    />
                                                    <Text
                                                        style={{
                                                            color: '#fff',
                                                            alignSelf: 'center',
                                                            marginTop: 5,
                                                        }}>
                                                        {"Âm thanh"}
                                                    </Text>
                                                </View>
                                                :
                                                <View>
                                                    <Icon
                                                        type="feather"
                                                        name="volume-2"
                                                        iconStyle={{
                                                            color: '#FBFBFB',
                                                            fontSize: 27,
                                                            alignSelf: 'center',
                                                        }}
                                                    />
                                                    <Text
                                                        style={{
                                                            color: '#fff',
                                                            alignSelf: 'center',
                                                            marginTop: 5,
                                                        }}>
                                                        {"Âm thanh"}
                                                    </Text>
                                                </View>
                                            }

                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => {
                                            if (statusCall == statusCallEnum.DaKetNoi) {
                                                setIsCuocGoiTransfer(isHold);
                                                setShowUI(showUICallEnum.UITransfer);
                                            }
                                        }}>
                                            <Icon
                                                type="fontisto"
                                                name="arrow-swap"
                                                iconStyle={{
                                                    color: statusCall == statusCallEnum.DaKetNoi ? '#fff' : '#aaa',
                                                    fontSize: 26,
                                                    alignSelf: 'center',
                                                }}
                                            />
                                            <Text
                                                style={{
                                                    color: statusCall == statusCallEnum.DaKetNoi ? '#fff' : '#aaa',
                                                    alignSelf: 'center',
                                                    marginTop: 5,
                                                }}>
                                                {"Chuyển"}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={{ flexDirection: 'row', flexGrow: 3, marginTop: 55, marginHorizontal: 20, justifyContent: 'space-around' }}>
                                        <TouchableOpacity onPress={() => {
                                            if (statusCall == statusCallEnum.DaKetNoi) {
                                                setShowUI(showUICallEnum.UIDialer);
                                            }
                                        }}>
                                            <Icon
                                                type="material"
                                                name="dialpad"
                                                iconStyle={{ color: statusCall == statusCallEnum.DaKetNoi ? '#fff' : '#aaa', fontSize: 27, alignSelf: 'center' }}
                                            />
                                            <Text
                                                style={{
                                                    color: statusCall == statusCallEnum.DaKetNoi ? '#fff' : '#aaa',
                                                    alignSelf: 'center',
                                                    marginTop: 5,
                                                }}>
                                                {"Bàn phím"}
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => {
                                            if (statusCall == statusCallEnum.DaKetNoi) {
                                                onHold(!isHold, 1);
                                            }
                                        }}>
                                            {isHold ?
                                                <View>
                                                    <Icon
                                                        type="fontisto"
                                                        name="pause"
                                                        iconStyle={{ color: statusCall == statusCallEnum.DaKetNoi ? '#fff' : '#aaa', fontSize: 27, alignSelf: 'center' }}
                                                    />
                                                    <Text
                                                        style={{
                                                            color: statusCall == statusCallEnum.DaKetNoi ? '#fff' : '#aaa',
                                                            alignSelf: 'center',
                                                            marginTop: 5,
                                                        }}>
                                                        {"Giữ"}
                                                    </Text>
                                                </View>
                                                :
                                                <View>
                                                    <Icon
                                                        type="feather"
                                                        name="pause"
                                                        iconStyle={{ color: statusCall == statusCallEnum.DaKetNoi ? '#fff' : '#aaa', fontSize: 27, alignSelf: 'center' }}
                                                    />
                                                    <Text
                                                        style={{
                                                            color: statusCall == statusCallEnum.DaKetNoi ? '#fff' : '#aaa',
                                                            alignSelf: 'center',
                                                            marginTop: 5,
                                                        }}>
                                                        {"Giữ"}
                                                    </Text>
                                                </View>

                                            }

                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={{ flex: 2, alignItems: 'center', alignContent: 'center', justifyContent: 'center' }}>
                                    <TouchableOpacity
                                        onPress={() => onHangUp()}
                                        style={[styles.buttonCircle, styles.bgDanger]}>
                                        <Icon
                                            type="material-community"
                                            style={styles.btnDanger}
                                            name="phone-hangup"
                                        />
                                    </TouchableOpacity>
                                </View>

                            </View>
                        </ImageBackground>
                    </View>
                )
            }
        </Modal>
    );
}

var styles = StyleSheet.create({
    image: {
        flex: 1,
        resizeMode: 'cover',
        justifyContent: 'center',
    },
    container: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'stretch',
        height: heightScreen,
        width: widthScreen,
    },
    innerContainer: {
        height: heightScreen,
        width: widthScreen,
    },
    innerContainerTransparent: {
        padding: 20,
    },
    buttonCircle: {
        borderWidth: 0,
        margin: 10,
        alignSelf: 'center',
        justifyContent: 'center',
        width: 70,
        height: 70,
        borderRadius: 50,
        marginTop: 55
    },
    bgDanger: {
        backgroundColor: '#F32013',
    },
    btnDanger: {
        color: '#fff',
    },
});

export default CuocGoiTransfer;