import React, { useState, useEffect } from 'react';
import { ImageBackground, Platform, StyleSheet, Text, View, TouchableOpacity, Modal, Dimensions } from 'react-native';
import BackgroundTimer from 'react-native-background-timer';
import { Icon } from 'react-native-elements';
import storeData from '../../hooks/storeData';
import keyStoreData from '../../utils/keyStoreData';
import { RTCPeerConnection, mediaDevices, RTCSessionDescription, } from 'react-native-webrtc';
import { getHubAndReconnect } from '../../hubmanager/HubManager';
import logSignalR from '../../utils/customLogSignalR';
import logData from '../../utils/logData';
import CuocgoiDB from '../../database/CuocGoiDB';
import RNCallKeep from 'react-native-callkeep';
import CallTypeEnum from '../../hubmanager/CallTypeEnum';
import BaseURL from '../../utils/BaseURL';
import ProgressApp from '../../components/ProgressApp';
import statusCallEnum from '../../utils/statusCallEnum';
import typeCallEnum from '../../utils/typeCallEnum';
import { useNavigation } from '@react-navigation/native';
import Calltimer from '../../components/Calltimer';
import PopUpDialerScreeen from '../cuocgoi/PopUpDialerScreeen';
import TransferScreen from '../cuocgoi/TransferScreen';
import showUICallEnum from '../../utils/showUICallEnum';

const widthScreen = Dimensions.get('window').width;
const heightScreen = Dimensions.get('window').height;

var conn = getHubAndReconnect();
var bitratePrew = 0;
var connectionCheckBitRate = null;

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

function CuocGoi({ route }) {
    const [connectionRTC, setConnectionRTC] = useState(null);
    const [isTransfer, setIsTransfer] = useState(false);
    const [isDTMF, setIsDTMF] = useState(false);
    const [isCall, setIsCall] = useState(true);
    const [isHold, setIsHold] = useState(false);
    const [timeStart, setTimeStart] = useState(new Date());
    const [callName, setCallName] = useState('');
    const [phonenumber, setPhonenumber] = useState('');
    const [typeCall, setTypeCall] = useState(0);
    const [statusCall, setStatusCall] = useState(statusCallEnum.DangKetNoi);
    const [txtStatusCall, setTxtStatusCall] = useState('');
    const [bitrate, setBitrate] = useState('');
    const [isMute, setIsMute] = useState(false);
    const [isSpeaker, setIsSpeaker] = useState(false);
    const [interValBitRate, setInterValBitRate] = useState(0);
    const [showUI, setShowUI] = useState(1);
    const [visibleModel, setVisibleModel] = useState(true);

    const navigation = useNavigation();

    const resetState = () => {
        BackgroundTimer.setTimeout(() => {
            if (interValBitRate != 0)
                BackgroundTimer.clearInterval(interValBitRate);

            let paramNotiData = {
                uniqueid: "",
                channel: "",
            };
            storeData.setStoreDataObject(keyStoreData.paramNoti, paramNotiData);

            setConnectionRTC(null);
            setPhonenumber('');
            setIsHold(false);
            setBitrate('');
            setTypeCall(0);
            setCallName('');
            setStatusCall(statusCallEnum.DangKetNoi);
            setIsMute(false);
            setIsSpeaker(false);
            setTxtStatusCall('');
            connectionCheckBitRate = null;

            setTimeStart(new Date());
            handleShowUI();
            setVisibleModel(false);
            navigation.navigate('BanPhim');
        }, 1000);

    }

    const onStartCall = async (so_dien_thoai, ho_ten) => {
        conn = getHubAndReconnect();
        console.log('đã vào đến phần này: 11 ', ho_ten, so_dien_thoai);

        let sessionCallId = await storeData.getStoreDataValue(keyStoreData.SessionCallId);
        outgoingCall(so_dien_thoai, sessionCallId);

        CuocgoiDB.addCuocGoi(so_dien_thoai, CallTypeEnum.OutboundCall);
        //Hiển thị màn hình cuộc gọi nhưng chưa đếm giây
    }

    const onAnswerCall = async (number, hoTen) => {
        logData.writeLogData('Đã nhấn trả lời cuộc gọi đến : ' + number);
        let signalData = await storeData.getStoreDataObject(keyStoreData.signalWebRTC);
        let SessionCallId = await storeData.getStoreDataValue(keyStoreData.SessionCallId);
        storeData.setStoreDataValue(keyStoreData.isAnswerCall, true);

        CuocgoiDB.addCuocGoi(number, CallTypeEnum.IncomingCall);
        setTimeStart(new Date());
        //Hiển thị màn hình cuộc gọi và bắt đầu đếm số

        incomingcall(new RTCSessionDescription(signalData.sdp), SessionCallId);
    };

    /// Handle SignalR //////////////////////////////////
    const callbackIceCandidateJanus = (evt, callid) => {
        conn = getHubAndReconnect();
        if (evt.candidate) {
            //Found a new candidate
            Januscandidates.push(JSON.stringify({ candidate: evt.candidate }));
        } else {
            try {
                logSignalR.clientCallServer('SendCandidate');
                conn.invoke('SendCandidate', Januscandidates, callid).then(() => {
                    logData.writeLogData('invoke: SendCandidate cuộc gọi đi')
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

        let stream = await mediaDevices.getUserMedia(webrtcConstraints);
        var connection = new RTCPeerConnection(configuration);

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
            setConnectionRTC(connection);
            connectionCheckBitRate = connection;
            setStatusCall(statusCallEnum.DangKetNoi);
            // setconsole.log('----connection', connection);
        } catch {
            console.log('----CallAsterisk Error call out');
        }
    }

    const incomingcall = async (sdp, sessionCall) => {
        conn = getHubAndReconnect();
        //console.log('incomingcall', sessionCall, sdp);
        let stream = await mediaDevices.getUserMedia(webrtcConstraints);
        let connection = new RTCPeerConnection(configuration);

        console.log('connection');
        connection.onicecandidate = (evt) =>
            callbackIceCandidateJanus(evt, sessionCall); // ICE Candidate Callback
        connection.onicecandidateerror = (error) =>
            callbackIceCandidateJanusError(error);
        connection.addStream(stream);
        connection.setRemoteDescription(sdp).then(() => {
            try {
                console.log('setRemoteDescription');
                connection.createAnswer().then((jsep) => {
                    connection.setLocalDescription(jsep).then(() => {
                        try {
                            logSignalR.clientCallServer('AnswerCallAsterisk')
                            conn.invoke('AnswerCallAsterisk', true, connection.localDescription.sdp, sessionCall).then(() => {
                                logData.writeLogData('Invoke AnswerCallAsterisk App: true | trả lời cuộc gọi ');
                                setConnectionRTC(connection);
                                connectionCheckBitRate = connection;
                                //console.log('[connection]', connection);
                                setStatusCall(statusCallEnum.DaKetNoi);
                            });
                        } catch (error) {
                            console.log('AnswerCallAsterisk Error call out', error);
                        }
                    });
                });

            }
            catch (error) {
                logSignalR.clientCallServerError('AnswerCallAsterisk', error);
            }
        })
    }

    const getTinHieu = async () => {
        if (connectionCheckBitRate) {
            connectionCheckBitRate.getStats(null).then(stats => {
                stats.forEach(report => {
                    if (report.type === 'inbound-rtp' && report.mediaType === 'audio') {
                        const bitrate = report.bytesReceived;
                        //console.log('[bitrate]: ', bitrate);
                        if (bitrate - bitratePrew <= 1) {
                            //kết nối yếu
                            setBitrate('Tín hiệu yếu');
                        }
                        else if (bitrate - bitratePrew == 0) {
                            //không có kết nối
                            setBitrate('Tín hiệu yếu');
                        }
                        else {
                            //kết nối tốt
                            setBitrate('Tín hiệu tốt');
                        }

                        bitratePrew = bitrate;
                    }
                });
            });
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
        logData.writeLogData('server call client: Calling, callid: ' + JSON.stringify(callid));
        try {
            conn.invoke("ConfirmEvent", "Calling");
        } catch (error) {
            logSignalR.clientCallServerError('Calling', error);
        }
        console.log("Calling Home: ", callid);
    })

    conn.off('receiveSignal')
    conn.on('receiveSignal', (signal, id) => {
        logSignalR.serverCallClient('receiveSignal');
        logData.writeLogData('server call client: receiveSignal ');
        try {
            conn.invoke("ConfirmEvent", "receiveSignal");

        } catch (error) {
            logSignalR.clientCallServerError('receiveSignal', error);
        }
        // Server trả về SDP cấu hình RTCSessionDescription qua sdp này cho người gọi đi
        newSignal(signal);
    });

    conn.off('ringing')
    conn.on('ringing', (id) => {
        setStatusCall(statusCallEnum.DoChuong);
        logSignalR.serverCallClient('Ringing');
        logData.writeLogData('server call client: Ringing');
        try {
            conn.invoke("ConfirmEvent", "Ringing");

        } catch (error) {
            logSignalR.clientCallServerError('Ringing', error);
        }
        // Server trả về SDP cấu hình RTCSessionDescription qua sdp này cho người gọi đi
    });

    conn.off('callAccepted')
    conn.on('callAccepted', (id) => {
        logData.writeLogData('Server call client: callAccepted');
        logSignalR.serverCallClient('callAccepted');
        setStatusCall(statusCallEnum.DaKetNoi);

        try {
            conn.invoke("ConfirmEvent", "callAccepted");
        } catch (error) {
            logSignalR.clientCallServerError('callAccepted', error);
        }
    });

    conn.off('callDeclined')
    conn.on('callDeclined', (callid, code, reason, id) => {

        logData.writeLogData('Server call client: callDeclined');
        logSignalR.serverCallClient('callEnded');
        RNCallKeep.endAllCalls();
        setStatusCall(statusCallEnum.DaKetThuc);
        resetState();
    });

    conn.off('callEnded')
    conn.on('callEnded', (callid, code, reason, id) => {

        logData.writeLogData('Server call client: callEnded');
        logSignalR.serverCallClient('callEnded');
        setStatusCall(statusCallEnum.DaKetThuc);
        RNCallKeep.endAllCalls();
        resetState();
    });

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

    const onHold = async () => {
        let sessionCallId = await storeData.getStoreDataValue(keyStoreData.SessionCallId);
        if (isHold === true) {
            try {
                conn = getHubAndReconnect();
                conn.invoke("Hold", sessionCallId);
            } catch {
                logData.writeLogData('Error invoke Hold');
            }
        }
        else {
            try {
                conn.invoke("UnHold", sessionCallId);
            } catch {
                logData.writeLogData('Error invoke UnHold');
            }
        }
    };


    const onHangUp = async () => {

        conn = getHubAndReconnect();

        let sessionCallId = await storeData.getStoreDataValue(keyStoreData.SessionCallId);
        console.log('hangUp');
        conn.invoke('hangUp', sessionCallId).then(() => {
            logData.writeLogData('Invoke: hangUp | App, số điện thoại đến: ' + phonenumber);
        }).catch();
        setStatusCall(statusCallEnum.DaKetThuc);
        try {
            RNCallKeep.endAllCalls();
        } catch (error) {

        }

        resetState();
    };

    const onDTMF = (dialString) => {
        console.log('[dialString]', dialString);
        if (connectionRTC != null) {
            connectionRTC.sendDtmfTone(dialString).then((json) => {
                console.log("onDTMF: ", json)
            }).catch();
        }
    }

    const onTransfer = (number, callName) => {
        console.log('Màn hình transfer cuộc gọi');

    }

    const onUpdateCall = async () => {
        let idCall = await storeData.getStoreDataValue(keyStoreData.callid);
        connectionRTC.createOffer({ iceRestart: true }).then((offer) => {
            connectionRTC.setLocalDescription(offer)
                .then(() => {
                    conn.invoke("UpdateOffer", connectionRTC.localDescription.sdp, idCall);
                })
                .catch();
        }).catch();
    }




    /// end xử lý nút bấm UI ///

    //RN Call Keep

    const didPerformDTMFAction = ({ callUUID, digits }) => {
        //Gọi hàm xử lý sự kiện bấm số khi dùng UI call mặc định
    };

    const didPerformSetMutedCallAction = ({ muted, callUUID }) => {
        //Gọi hàm xử lý sự kiện mute 
    };

    const didToggleHoldCallAction = async ({ hold, callUUID }) => {
        //Họi hàm xử lý sự kiện hold
        let sessionCallId = await storeData.getStoreDataValue(keyStoreData.SessionCallId);

        if (hold === true) {
            try {
                setIsHold(true);
                conn.invoke("Hold", sessionCallId);
            } catch (error) {

            }
        }
        else {
            try {
                conn.invoke("UnHold", sessionCallId);
                setIsHold(false);
            } catch (error) {

            }
        }
    };

    //End RN Call Keep

    //Send data to server
    const sendDataDisconectCall = () => {
        console.log("sendDataDisconectCall")

    }
    const sendDataMissCallDisconect = (type) => {
        console.log("sendDataMissCallDisconect")
    }
    const renderProcess = () => {
        if (showProcess) {
            return (
                <ProgressApp />
            );
        } else {
            return null;
        }
    }

    const loadParams = async () => {
        let _type = await storeData.getStoreDataValue(keyStoreData.typeCall);
        if (_type == typeCallEnum.outgoingCall) {
            console.log('[Outcomming call]');
            let _soDienThoaiDi = await storeData.getStoreDataValue(keyStoreData.soDienThoaiDi);
            let _hoTenDienThoaiDi = await storeData.getStoreDataValue(keyStoreData.hoTenDienThoaiDi);
            setPhonenumber(_soDienThoaiDi);
            setCallName(_hoTenDienThoaiDi);

            if (_soDienThoaiDi === '') {
                alert('Số điện thoại không đúng định dạng.');
                logData.writeLogData('Số điện thoại không đúng định dạng.');
                navigation.navigate('BanPhim');
            }
            console.log('[Outcomming call]: ', _soDienThoaiDi, _hoTenDienThoaiDi, _type);
            onStartCall(_soDienThoaiDi, _hoTenDienThoaiDi);
        }
        else if (_type == typeCallEnum.IncomingCall) {
            console.log('[IncomingCall]');
            let _soDienThoaiDen = await storeData.getStoreDataValue(keyStoreData.soDienThoaiDen);
            let _hoTenDienThoaiDen = await storeData.getStoreDataValue(keyStoreData.hoTenDienThoaiDen);
            setPhonenumber(_soDienThoaiDen);
            setCallName(_hoTenDienThoaiDen);

            if (_soDienThoaiDen === '') {
                alert('Số điện thoại không đúng định dạng.');
                logData.writeLogData('Số điện thoại không đúng định dạng.');
                navigation.navigate('BanPhim');
            }
            console.log('[IncomingCall]: ', _soDienThoaiDen, _hoTenDienThoaiDen, _type);
            onAnswerCall(_soDienThoaiDen, _hoTenDienThoaiDen);
        }
        else {
            resetState();
        }
    }

    React.useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            setVisibleModel(true);
            setTimeStart(new Date());
            loadParams();
            // const { soDienThoai } = route.params ?? '';
            // const { type } = route.params ?? 0;
            // const { hoTen } = route.hoTen ?? '';
            // setPhonenumber(soDienThoai);
            // storeData.setStoreDataValue(keyStoreData.soDienThoaiDi, soDienThoai);
            // storeData.setStoreDataValue(keyStoreData.hoTenDienThoaiDi, hoTen);
            // setCallName(hoTen);
            // setTypeCall(type);

            // if (soDienThoai === '') {
            //     alert('Số điện thoại không đúng định dạng.');
            //     logData.writeLogData('Số điện thoại không đúng định dạng.');
            //     navigation.navigate('BanPhim');
            // }
            // else {
            //     if (type == typeCallEnum.IncomingCall) {
            //         onAnswerCall(soDienThoai, hoTen);
            //     }
            //     else if (type == typeCallEnum.outgoingCall) {
            //         onStartCall(soDienThoai, hoTen);
            //     }
            //     else {
            //         logData.writeLogData('Sai kiểu dữ liệu cuộc gọi');
            //         navigation.navigate('BanPhim');
            //     }
            // }
            //  });

            return () => {
                unsubscribe;
            }
        });
    }, [navigation]);

    useEffect(() => {
        CallStatus();
        console.log('[statusCall]: 3', statusCall);
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
        RNCallKeep.addEventListener('didPerformDTMFAction', didPerformDTMFAction);
        RNCallKeep.addEventListener('didPerformSetMutedCallAction', didPerformSetMutedCallAction);
        RNCallKeep.addEventListener('didToggleHoldCallAction', didToggleHoldCallAction);


        return () => {
            RNCallKeep.removeEventListener('didPerformDTMFAction', didPerformDTMFAction);
            RNCallKeep.removeEventListener('didPerformSetMutedCallAction', didPerformSetMutedCallAction);
            RNCallKeep.removeEventListener('didToggleHoldCallAction', didToggleHoldCallAction);
        }
    }, []);

    const handleShowUI = () => {
        if (showUI == showUICallEnum.UITransfer) {
            setIsCall(false);
            setIsTransfer(true);
            setIsDTMF(false);
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
                        {/* <TransferScreen hideTransfer={() => { setIsTransfer(false); setIsHold(false); onHold() }}></TransferScreen> */}
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
                                style={{ position: 'absolute', top: 20, width: '100%' }}>
                                <View style={{ flexDirection: 'column' }}>
                                    <Text
                                        style={{
                                            color: '#fff',
                                            alignSelf: 'center',
                                            marginTop: 15,
                                            fontWeight: 'bold',
                                            fontSize: 32,
                                        }}>
                                        {phonenumber}
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
                                <View style={{ marginTop: 30 }}>
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
                                <View style={{ flexDirection: 'row', flexGrow: 3, marginTop: 55, marginHorizontal: 20, justifyContent: 'space-around' }}>
                                    <TouchableOpacity onPress={() => {
                                        setIsMute(!isMute);
                                    }}>
                                        {isMute ?
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
                                            :
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
                                        }

                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => {
                                        //this.callManager.onSpeaker(!this.state.isSpeaker)
                                        setIsSpeaker(!isSpeaker);
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
                                            setIsHold(true);
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
                                            setIsHold(!isHold);
                                            onHold();
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

export default CuocGoi;