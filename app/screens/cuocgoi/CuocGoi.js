import React, {useState, useEffect} from 'react';
import {
  ImageBackground,
  Platform,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Dimensions,
  BackHandler
} from 'react-native';
import BackgroundTimer from 'react-native-background-timer';
import {Icon} from 'react-native-elements';
import storeData from '../../hooks/storeData';
import keyStoreData from '../../utils/keyStoreData';
import {
  RTCPeerConnection,
  mediaDevices,
  RTCSessionDescription,
} from 'react-native-webrtc';
import {getHubAndReconnect} from '../../hubmanager/HubManager';
import logSignalR from '../../utils/customLogSignalR';
import logData from '../../utils/logData';
import CuocgoiDB from '../../database/CuocGoiDB';
import RNCallKeep from 'react-native-callkeep';
import CallTypeEnum from '../../hubmanager/CallTypeEnum';
import BaseURL from '../../utils/BaseURL';
import ProgressApp from '../../components/ProgressApp';
import statusCallEnum from '../../utils/statusCallEnum';
import typeCallEnum from '../../utils/typeCallEnum';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import Calltimer from '../../components/Calltimer';
import PopUpDialerScreeen from '../cuocgoi/PopUpDialerScreeen';
import TransferScreen from '../cuocgoi/TransferScreen';
import showUICallEnum from '../../utils/showUICallEnum';
import NetInfo from '@react-native-community/netinfo';
import Toast from 'react-native-simple-toast';
import InCallManager from 'react-native-incall-manager';
import useSendMissCall from '../../hooks/useSendMissCall';
import statusMissCallType from '../../utils/statusMissCallType';
import {isLandscape} from 'react-native-device-info';
import {variant} from 'styled-system';

BackgroundTimer.start();

const widthScreen = Dimensions.get('window').width;
const heightScreen = Dimensions.get('window').height;
const isIOS = Platform.OS === 'ios';

var conn = getHubAndReconnect();
var bitratePrew = 0;
var coutTinHieuYeu = 0;
var connectionCheckBitRate = null;
var _callID = '';
var sessionID = '';
var timeoutID;
var stremRTC = null;
var isconnectionHold = false;

const configuration = {
  iceServers: [
    {url: 'stun:stun.voipbuster.com'},
    {url: 'stun:42.112.31.62:3478'},
    {
      url: 'turn:42.112.31.62:3478',
      username: 'lachong',
      credential: 'axy@789',
    },
  ],
};

var Januscandidates = new Array();
const webrtcConstraints = {audio: true, video: false};

function CuocGoi({route}) {
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
  const [isCuocGoiTransfer, setIsCuocGoiTransfer] = useState(false);
  const [visibleModel, setVisibleModel] = useState(true);

  const navigation = useNavigation();
  const useSendMissCallHook = useSendMissCall();

  const resetState = () => {
    console.log('[resetState Cuoc Goi]');
    setTimeout(async () => {
      if (interValBitRate != 0) clearInterval(interValBitRate);

      let paramNotiData = {
        uniqueid: '',
        channel: '',
      };
      storeData.setStoreDataObject(keyStoreData.paramNoti, paramNotiData);
      storeData.setStoreDataValue(keyStoreData.isHold, false);
      setPhonenumber('');
      setIsHold(false);
      setBitrate('');
      setTypeCall(0);
      coutTinHieuYeu = 0;
      setCallName('');
      setStatusCall(statusCallEnum.DaKetThuc);
      setIsMute(false);
      setIsSpeaker(false);
      setIsCuocGoiTransfer(false);
      setTxtStatusCall('');
      stremRTC = null;
      sessionID = '';
      _callID = '';
      isconnectionHold = false;

      setTimeStart(new Date());
      handleShowUI();
      setVisibleModel(false);
      storeData.setStoreDataValue(keyStoreData.isAnswerCall, false);
      storeData.setStoreDataValue(keyStoreData.soDienThoaiDi, '');
      storeData.setStoreDataValue(keyStoreData.soDienThoaiDen, '');
      storeData.setStoreDataValue(keyStoreData.soDienThoai, '');
      if (connectionCheckBitRate) connectionCheckBitRate.close();
      connectionCheckBitRate = null;

      if (isIOS) {
        let callUID = await storeData.getStoreDataValue(keyStoreData.callUUID);

        if (callUID) {
          RNCallKeep.endCall(callUID);
        } else {
          RNCallKeep.endAllCalls();
        }
      }

      navigation.navigate('BanPhim');
    }, 1000);
  };

  const onStartCall = async (so_dien_thoai, ho_ten) => {
    InCallManager.setSpeakerphoneOn(false);

    conn = getHubAndReconnect();
    console.log('đã vào đến phần này: 11 ', ho_ten, so_dien_thoai);

    let sessionCallId = await storeData.getStoreDataValue(
      keyStoreData.SessionCallId,
    );
    outgoingCall(so_dien_thoai.replace(/\s/g,''), sessionCallId);

    CuocgoiDB.addCuocGoi(so_dien_thoai.replace(/\s/g,''), CallTypeEnum.OutboundCall);
    //Hiển thị màn hình cuộc gọi nhưng chưa đếm giây
  };

  const onAnswerCall = async number => {
    InCallManager.setSpeakerphoneOn(false);

    console.log('[xử ký tra loi cuoc goi]');
    logData.writeLogData('Đã nhấn trả lời cuộc gọi đến : ' + number);
    let signalData = await storeData.getStoreDataObject(
      keyStoreData.signalWebRTC,
    );
    let SessionCallId = await storeData.getStoreDataValue(
      keyStoreData.SessionCallId,
    );
    storeData.setStoreDataValue(keyStoreData.isAnswerCall, true);

    CuocgoiDB.addCuocGoi(number.replace(/\s/g,''), CallTypeEnum.IncomingCall);
    setTimeStart(new Date());
    //Hiển thị màn hình cuộc gọi và bắt đầu đếm số

    incomingcall(new RTCSessionDescription(signalData.sdp), SessionCallId);
  };

  /// Handle SignalR //////////////////////////////////
  const callbackIceCandidateJanus = (evt, id) => {
    conn = getHubAndReconnect();
    if (evt.candidate) {
      //Found a new candidate
      Januscandidates.push(JSON.stringify({candidate: evt.candidate}));
    } else {
      try {
        conn.invoke('SendCandidate', Januscandidates, id).then(() => {
          console.log('invoke: SendCandidate cuộc gọi đi ', phonenumber);
          logData.writeLogData(
            'invoke: SendCandidate cuộc gọi đi ' + phonenumber.toString(),
          );
        });
      } catch (error) {
        console.log(
          '----Call server Error callbackIceCandidateJanus Error: ',
          error,
        );
      }
      Januscandidates = new Array();
    }
  };

  const callbackIceCandidateJanusState = evt => {
    if (evt) {
      console.log('[callbackIceCandidateJanusState]');
      //Found a new candidate
      //console.log(evt);
    }
  };
  const callbackIceCandidateJanusError = err => {
    if (err) {
      console.log(err);
    }
  };

  const outgoingCall = async (number, sessionCall) => {
    conn = getHubAndReconnect();

    let stream = await mediaDevices.getUserMedia(webrtcConstraints);
    stremRTC = stream;
    var connection = new RTCPeerConnection(configuration);

    connection.onicecandidate = evt =>
      callbackIceCandidateJanus(evt, sessionCall); // ICE Candidate Callback
    connection.onicecandidateerror = error =>
      callbackIceCandidateJanusError(error);
    connection.oniceconnectionstatechange = evt =>
      callbackIceCandidateJanusState(evt);
    connection.addStream(stream);
    let offer = await connection.createOffer();
    let descriptionType = await connection.setLocalDescription(offer);

    try {
      conn
        .invoke(
          'CallAsterisk',
          number.replace(/\s/g,'') ,
          connection.localDescription.sdp ,
          sessionCall,
        )
        .then(() => {
          logData.writeLogData('invoke: CallAsterisk cuộc gọi đi ' + number.replace(/\s/g,''));
        });
      connectionCheckBitRate = connection;
      setStatusCall(statusCallEnum.DangKetNoi);
      // setconsole.log('----connection', connection);
    } catch(err) {
      console.log('----CallAsterisk Error call out');
    }
  };

  const incomingcall = async (sdp, sessionCall) => {
    console.log('[incomingcall cuoc goi]');

    conn = getHubAndReconnect();
    let stream = await mediaDevices.getUserMedia(webrtcConstraints);
    stremRTC = stream;
    var connection = new RTCPeerConnection(configuration);

    connection.onicecandidate = evt =>
      callbackIceCandidateJanus(evt, sessionCall); // ICE Candidate Callback
    connection.onicecandidateerror = error =>
      callbackIceCandidateJanusError(error);
    connection.addStream(stream);
    await connection.setRemoteDescription(sdp);
    let answer = await connection.createAnswer();
    await connection.setLocalDescription(answer);

    try {
      console.log('[AnswerCallAsterisk]: true');
      logSignalR.clientCallServer('AnswerCallAsterisk');
      conn
        .invoke(
          'AnswerCallAsterisk',
          true,
          connection.localDescription.sdp,
          sessionCall,
        )
        .then(() => {
          logData.writeLogData(
            'Invoke AnswerCallAsterisk App: true | trả lời cuộc gọi ',
          );
        });

      connectionCheckBitRate = connection;
      setStatusCall(statusCallEnum.DaKetNoi);
    } catch (error) {
      console.log('AnswerCallAsterisk Error call out', error);
    }
  };

  const getTinHieu = async () => {
    if (connectionCheckBitRate) {
      connectionCheckBitRate.getStats(null).then(stats => {
        stats.forEach(async report => {
          if (report.type === 'inbound-rtp' && report.mediaType === 'audio') {
            const bitrate = parseFloat(report.bytesReceived);
            //console.log('[bitrate]', report);
            //console.log('[bitrate]: ', bitrate);
            if (bitrate - bitratePrew <= 0 && !isconnectionHold) {
              //kết nối yếu

              setBitrate('Tín hiệu yếu');
              coutTinHieuYeu += 1;
              if (coutTinHieuYeu == 3) {
                //InCallManager.startRingback('_BUNDLE_');
                InCallManager.setSpeakerphoneOn(isSpeaker);
              }

              // console.log('[Tín hiệu yếu]', coutTinHieuYeu);

              if (coutTinHieuYeu % 3 == 0) {
                onUpdateCall();
              }

              if (coutTinHieuYeu >= 25) {
                //InCallManager.stopRingback();
                handleEndCallTinHieuYeu();
              }
            }
            // else if (bitrate - bitratePrew == 0) {
            //     //không có kết nối
            //     setBitrate('Tín hiệu yếu');
            // }
            else {
              // console.log('[Tín hiệu tốt]')
              //kết nối tốt
              if (coutTinHieuYeu > 0) {
                //InCallManager.stopRingback();
                InCallManager.setSpeakerphoneOn(isSpeaker);
              }
              coutTinHieuYeu = 0;
              setBitrate('Tín hiệu tốt');
            }

            bitratePrew = bitrate;
          }
        });
      });
    }
  };

  const newSignal = data => {
    var signal = JSON.parse(data);
    // Route signal based on type
    if (signal.sdp) {
      if (connectionCheckBitRate) {
        try {
          connectionCheckBitRate
            .setRemoteDescription(new RTCSessionDescription(signal.sdp))
            .then(() => {
              console.log('Et thành công setRemoteDescription');
            });
        } catch (error) {
          logData.writeLogData(
            'WebRTC: Error while setting remote description',
          );
          console.log('WebRTC: Error while setting remote description');
        }
      }
    }
  };

  // conn.off('UpdatingCall')
  // conn.on('UpdatingCall', (sdp, session_id) => {
  //     conn.invoke("ConfirmEvent", "UpdatingCall").catch((error) => console.log(error));

  //     onUpdateCall(sdp, session_id);
  // })

  ////////// End handle SignalR //////////////////////

  /// Xử lý event liên quan đến nút bấm UI ///

  const CallStatus = () => {
    console.log('statusCall: ', statusCall);
    if (statusCall == statusCallEnum.DaKetNoi) {
      if (isHold) {
        setTxtStatusCall('Đang giữ');
      } else setTxtStatusCall(' Đã kết nối');
    } else if (statusCall == statusCallEnum.DangKetNoi) {
      setTxtStatusCall(' Đang kết nối...');
    } else if (statusCall == statusCallEnum.DoChuong) {
      setTxtStatusCall(' Đang đổ chuông...');
    } else {
      setTxtStatusCall(' Cuộc gọi kết thúc');
    }
  };

  const onHold = async (value, isclick) => {
    let sessionCallId = await storeData.getStoreDataValue(
      keyStoreData.SessionCallId,
    );
    console.log('[isHold]', value, isclick, isHold);
    if (isclick == 1) {
      setIsHold(value);
      isconnectionHold = value;
      storeData.setStoreDataValue(keyStoreData.isHold, value);
    }

    if (value) {
      try {
        conn = getHubAndReconnect();
        //conn.invoke("Hold", sessionCallId);
        //setRemoteAudio(false);
        onHoldCall(false);
      } catch {
        logData.writeLogData('Error invoke Hold');
      }
      InCallManager.stopRingtone();
    } else {
      if (isclick == 1) {
        try {
          //conn.invoke("UnHold", sessionCallId);
          //setRemoteAudio(true);
          onHoldCall(true);
        } catch {
          logData.writeLogData('Error invoke UnHold');
        }
      } else {
        if (isHold == false) {
          try {
            //conn.invoke("UnHold", sessionCallId);
            //setRemoteAudio(true);
            onHoldCall(true);
          } catch {
            logData.writeLogData('Error invoke UnHold');
          }
        }
      }

      InCallManager.startRingtone();
    }

    return;
  };

  const startRingtone = () => {
    InCallManager.startRingtone('_DEFAULT_');
  };

  const stopRingtone = () => {
    InCallManager.stopRingtone();
  };

  const startCall = () => {
    InCallManager.start({media: 'audio', ringback: '_BUNDLE_'});
  };
  const stopCall = () => {
    InCallManager.stop({busytone: '_DEFAULT_'});
  };
  const onSpeaker = () => {
    console.log('onSpeaker: ', !isSpeaker);
    InCallManager.setSpeakerphoneOn(!isSpeaker);
    setIsSpeaker(!isSpeaker);
  };
  const onMute = () => {
    console.log('[onMute]: ', !isMute);
    stremRTC.getAudioTracks()[0].enabled = isMute;
    setIsMute(!isMute);
  };

  const onHangUp = async () => {
    try {
      conn = getHubAndReconnect();

      let sessionCallId = await storeData.getStoreDataValue(
        keyStoreData.SessionCallId,
      );
      console.log('hangUp');

      if (isIOS) {
        let callUID = await storeData.getStoreDataValue(keyStoreData.callUUID);

        if (callUID) {
          RNCallKeep.endCall(callUID);
        } else {
          RNCallKeep.endAllCalls();
        }
      }

      conn
        .invoke('hangUp', sessionCallId)
        .then(async () => {
          logData.writeLogData(
            'Invoke: hangUp | App, số điện thoại đến: ' + phonenumber,
          );
        })
        .catch();

      if (coutTinHieuYeu > 2 && coutTinHieuYeu < 25) {
        useSendMissCallHook.request(
          phonenumber,
          statusMissCallType.KetNoiYeuDTVKetThuc,
        );
      }

      // if (isIOS) {
      //   let callUIID = await storeData.getStoreDataValue(keyStoreData.callUUID);
      //   RNCallKeep.endCall(callUIID);
      // }

      setTimeout(() => {
        setStatusCall(statusCallEnum.DaKetThuc);
        Toast.showWithGravity('Kết thúc cuộc gọi.', Toast.LONG, Toast.BOTTOM);
        clearInterval(interValBitRate);
        resetState();
      }, 1000);
    } catch {
      resetState();
    }
  };

  const onDTMF = dialString => {
    console.log('[dialString]', dialString);
    if (connectionCheckBitRate != null) {
      connectionCheckBitRate
        .sendDtmfTone(dialString)
        .then(json => {
          console.log('onDTMF: ', json);
        })
        .catch();
    }
  };

  const onUpdateCall = async () => {
    let sessionCallId = await storeData.getStoreDataValue(
      keyStoreData.SessionCallId,
    );
    connectionCheckBitRate
      .createOffer({iceRestart: true})
      .then(offer => {
        connectionCheckBitRate
          .setLocalDescription(offer)
          .then(() => {
            conn.invoke(
              'UpdateOffer',
              connectionCheckBitRate.localDescription.sdp,
              sessionCallId,
            );
          })
          .catch();
      })
      .catch();
  };

  const onHoldCall = check => {
    if (connectionCheckBitRate) {
      console.log('[OnHold Call] : ' + check.toString());
      connectionCheckBitRate
        .createOffer({iceRestart: true, offerToReceiveAudio: check})
        .then(offer => {
          connectionCheckBitRate
            .setLocalDescription(offer)
            .then(() => {
              conn.invoke(
                'UpdateOffer',
                connectionCheckBitRate.localDescription.sdp,
                sessionID,
              );
            })
            .catch();
        })
        .catch();

      connectionCheckBitRate.onicecandidate = evt =>
        callbackIceCandidateJanus(evt, sessionID);
    }
  };

  /// end xử lý nút bấm UI ///

  //End RN Call Keep
  const handleEndCallTinHieuYeu = () => {
    console.log('[handleEndCallTinHieuYeu]');
    useSendMissCallHook.request(
      phonenumber,
      statusMissCallType.OverTimeOutKetNoiYeu,
    );
    setStatusCall(statusCallEnum.DaKetThuc);
    conn = getHubAndReconnect();
    try {
      conn
        .invoke('hangUp', sessionID)
        .then(() => {
          logData.writeLogData(
            'Invoke: hangUp | App, số điện thoại đến: ' + phonenumber,
          );
        })
        .catch();
    } catch (error) {}

    Toast.showWithGravity('Kết thúc cuộc gọi.', Toast.LONG, Toast.BOTTOM);
    clearInterval(interValBitRate);
    resetState();
  };

  const handleShowUI = () => {
    if (showUI == showUICallEnum.UITransfer) {
      // onHold(true, 0).then(() => {
      //     setIsCall(false);
      //     setIsTransfer(true);
      //     setIsDTMF(false);
      // });
      setIsCall(false);
      setIsTransfer(true);
      setIsDTMF(false);
    } else if (showUI == showUICallEnum.UIDialer) {
      setIsCall(false);
      setIsTransfer(false);
      setIsDTMF(true);
    } else {
      setIsCall(true);
      setIsTransfer(false);
      setIsDTMF(false);
    }
  };

  const loadParams = async () => {
    let _type = await storeData.getStoreDataValue(keyStoreData.typeCall);
    if (_type == typeCallEnum.outgoingCall) {
      console.log('[Outcomming call]');
      let _soDienThoaiDi = await storeData.getStoreDataValue(
        keyStoreData.soDienThoaiDi,
      );
      let _hoTenDienThoaiDi = await storeData.getStoreDataValue(
        keyStoreData.hoTenDienThoaiDi,
      );
      sessionID = (
        await storeData.getStoreDataValue(keyStoreData.SessionCallId)
      ).toString();
      setPhonenumber(_soDienThoaiDi.replace(/\s/g,''));
      setCallName(_hoTenDienThoaiDi);

      if (_soDienThoaiDi == '' || _soDienThoaiDi == null) {
        logData.writeLogData('Số điện thoại không đúng định dạng.');
        setVisibleModel(false);
        navigation.navigate('BanPhim');
      } else {
        setVisibleModel(true);
      }
      console.log(
        '[Outcomming call]: ',
        _soDienThoaiDi,
        _hoTenDienThoaiDi,
        _type,
      );
      onStartCall(_soDienThoaiDi, _hoTenDienThoaiDi);
    } else if (_type == typeCallEnum.IncomingCall) {
      console.log('[IncomingCall]');
      let _soDienThoaiDen = await storeData.getStoreDataValue(
        keyStoreData.soDienThoaiDen,
      );
      let _hoTenDienThoaiDen = await storeData.getStoreDataValue(
        keyStoreData.hoTenDienThoaiDen,
      );
      let obj = await storeData.getStoreDataValue(keyStoreData.callid);
      if (obj) _callID = obj.toString();
      setPhonenumber(_soDienThoaiDen);
      setCallName(_hoTenDienThoaiDen);

      if (_soDienThoaiDen == '' || _soDienThoaiDen == null) {
        logData.writeLogData('Số điện thoại không đúng định dạng.');
        setVisibleModel(false);
        navigation.navigate('BanPhim');
      } else {
        setVisibleModel(true);
      }
      console.log(
        '[IncomingCall]: ',
        _soDienThoaiDen,
        _hoTenDienThoaiDen,
        _type,
      );
      onAnswerCall(_soDienThoaiDen);
    } else {
      resetState();
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      setStatusCall(statusCallEnum.DangKetNoi);
      InCallManager.setSpeakerphoneOn(isSpeaker);
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          console.log(["Back nè"]);
        }
      );

      conn.off('Calling');
      conn.on('Calling', (callid, msg, id) => {
        if (sessionID == id) {
          _callID = callid;
          InCallManager.start({media: 'audio'});
          logSignalR.serverCallClient('Calling');
          logData.writeLogData(
            'server call client: Calling, callid: ' + JSON.stringify(callid),
          );
          try {
            conn.invoke('ConfirmEvent', 'Calling', callid);
          } catch (error) {
            logSignalR.clientCallServerError('Calling', error);
          }
          console.log('Calling Home: ', callid);
        }
      });

      conn.off('receiveSignal');
      conn.on('receiveSignal', (signal, id) => {
        logSignalR.serverCallClient('receiveSignal receiveSignal CuocGoi ');
        logData.writeLogData('server call client: receiveSignal CuocGoi ');
        try {
          conn.invoke('ConfirmEvent', 'receiveSignal', null);
        } catch (error) {
          logSignalR.clientCallServerError('receiveSignal', error);
        }
        // Server trả về SDP cấu hình RTCSessionDescription qua sdp này cho người gọi đi
        newSignal(signal);
      });

      conn.off('ringing');
      conn.on('ringing', id => {
        setStatusCall(statusCallEnum.DoChuong);
        logSignalR.serverCallClient('Ringing');
        logData.writeLogData('server call client: Ringing');
        try {
          conn.invoke('ConfirmEvent', 'Ringing', null);
        } catch (error) {
          logSignalR.clientCallServerError('Ringing', error);
        }
        // Server trả về SDP cấu hình RTCSessionDescription qua sdp này cho người gọi đi
      });

      conn.off('callAccepted');
      conn.on('callAccepted', id => {
        if(isHold) return;
        setTimeStart(new Date());

        logData.writeLogData('Server call client: callAccepted');
        logSignalR.serverCallClient('callAccepted');
        setStatusCall(statusCallEnum.DaKetNoi);
        try {
          conn.invoke('ConfirmEvent', 'callAccepted', null);
        } catch (error) {
          logSignalR.clientCallServerError('callAccepted', error);
        }

        if (isIOS) {
          InCallManager.stopRingtone();
          // Set AVAudioSession mode
          // AudioSession.setMode('VoiceChat')
          //   .then(() => { console.log('Success!') })
          //   .catch(error => { console.log('Error!') })
        }
      });

      conn.off('callDeclined');
      conn.on('callDeclined', async (callid, code, reason, id) => {
        conn
          .invoke('ConfirmEvent', 'callDeclined', callid)
          .catch(error => console.log(error));

        logData.writeLogData('Server call client: callDeclined');
        logSignalR.serverCallClient('callEnded');
        setStatusCall(statusCallEnum.DaKetThuc);

        resetState();
        Toast.showWithGravity(reason, Toast.LONG, Toast.BOTTOM);
      });

      conn.off('callEnded');
      conn.on('callEnded', async (callid, code, reason, id) => {
        console.log('CallID :' + _callID);
        if (_callID == callid) {
          conn
            .invoke('ConfirmEvent', 'callEnded', callid)
            .catch(error => console.log(error));
          logData.writeLogData('Server call client: callEnded');
          logSignalR.serverCallClient('callEnded');
          setStatusCall(statusCallEnum.DaKetThuc);

          if (isIOS) {
            let callUID = await storeData.getStoreDataValue(
              keyStoreData.callUUID,
            );

            if (callUID) {
              RNCallKeep.endCall(callUID);
            } else {
              RNCallKeep.endAllCalls();
            }
          }

          resetState();
          Toast.showWithGravity(reason, Toast.LONG, Toast.BOTTOM);
        }
      });

      return () => {
        conn.off('Calling');
        conn.off('receiveSignal');
        conn.off('ringing');
        conn.off('callAccepted');
        conn.off('callDeclined');
        conn.off('callEnded');
        InCallManager.stopRingback();
        backHandler.remove();
      };
    }, []),
  );

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      storeData.getStoreDataValue(keyStoreData.isHold).then(isHoldData => {
        if (isHoldData != 'true') {
          loadParams();
        } else {
          setVisibleModel(true);
        }
      });

      return () => {
        unsubscribe;
      };
    });
    console.log('Cuoc goi navigation effect');
  }, [navigation]);

  useEffect(() => {
    CallStatus();
    console.log('[statusCall]: 3', statusCall);
    if (statusCall == statusCallEnum.DaKetNoi) {
      if (interValBitRate != 0) clearInterval(interValBitRate);

      let interVal = setInterval(() => {
        getTinHieu();
      }, 1000);
      console.log('[interVal]', interVal);
      setInterValBitRate(interVal);
    }
  }, [statusCall]);

  useEffect(() => {
    handleShowUI();
  }, [showUI]);

  useEffect(() => {}, [visibleModel]);

  return (
    <Modal
      style={{height: heightScreen, width: widthScreen}}
      animationType="fade"
      transparent={true}
      visible={visibleModel}
      onRequestClose={() => {
        console.log('[visibleModel]', visibleModel);
        //setVisibleModel(false);
        //alert('[visibleModel]');
      }}>
      {isTransfer === true && (
        <View style={{flex: 1}}>
          <TransferScreen
            numberIncoming={phonenumber}
            isCuocGoiTransfer={isCuocGoiTransfer}
            hideTransfer={() => {
              setShowUI(showUICallEnum.UICall);
            }}
            hideModal={() => {
              setVisibleModel(false);
            }}></TransferScreen>
        </View>
      )}

      {isDTMF === true && (
        <View style={{flex: 1}}>
          <PopUpDialerScreeen
            hideDialer={() => {
              setShowUI(showUICallEnum.UICall);
            }}
            dtmf={numberDialer => onDTMF(numberDialer)}
          />
        </View>
      )}

      {isCall === true && (
        <View style={{flex: 1}}>
          <ImageBackground
            source={require('../../Toda_Images/Dark_Gray.png')}
            style={[styles.container, styles.image]}>
            <View style={{width: '100%', flexDirection: 'column', flex: 1}}>
              <View style={{flex: 1, flexDirection: 'column', width: '100%'}}>
                <View
                  style={{
                    alignContent: 'center',
                    justifyContent: 'center',
                    flex: 1,
                  }}>
                  {callName == phonenumber ? (
                    <>
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
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
                </View>
                <View
                  style={{
                    flex: 1,
                    alignContent: 'center',
                    justifyContent: 'center',
                  }}>
                  {isHold !== true && statusCall == statusCallEnum.DaKetNoi ? (
                    <Calltimer TimeDuration={timeStart} />
                  ) : (
                    <Text
                      style={{
                        color: '#fff',
                        alignSelf: 'center',
                        marginTop: 5,
                        fontSize: 25,
                      }}>
                      {txtStatusCall}
                    </Text>
                  )}

                  {statusCall === statusCallEnum.DaKetNoi ? (
                    <Text
                      style={{
                        color: '#fff',
                        alignSelf: 'center',
                        marginTop: 10,
                        fontSize: 18,
                      }}>
                      {bitrate}
                    </Text>
                  ) : null}
                </View>
              </View>
              <View style={{flex: 1, flexDirection: 'column', width: '100%'}}>
                <View style={{flex: 2, width: '100%'}}>
                  <View
                    style={{
                      flexDirection: 'row',
                      flexGrow: 3,
                      marginHorizontal: 20,
                      justifyContent: 'space-around',
                      marginTop: 40,
                    }}>
                    <TouchableOpacity
                      onPress={() => {
                        onMute();
                      }}>
                      {isMute ? (
                        <View>
                          <Icon
                            type="feather"
                            name="mic-off"
                            iconStyle={{
                              color: '#fff',
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
                            {'Tắt tiếng'}
                          </Text>
                        </View>
                      ) : (
                        <View>
                          <Icon
                            type="feather"
                            name="mic"
                            iconStyle={{
                              color: '#fff',
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
                            {'Tắt tiếng'}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        onSpeaker();
                      }}>
                      {isSpeaker ? (
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
                            {'Âm thanh'}
                          </Text>
                        </View>
                      ) : (
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
                            {'Âm thanh'}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        if (statusCall == statusCallEnum.DaKetNoi) {
                          setIsCuocGoiTransfer(isHold);
                          setShowUI(showUICallEnum.UITransfer);
                        }
                      }}>
                      <Icon
                        type="fontisto"
                        name="arrow-swap"
                        iconStyle={{
                          color:
                            statusCall == statusCallEnum.DaKetNoi
                              ? '#fff'
                              : '#aaa',
                          fontSize: 26,
                          alignSelf: 'center',
                        }}
                      />
                      <Text
                        style={{
                          color:
                            statusCall == statusCallEnum.DaKetNoi
                              ? '#fff'
                              : '#aaa',
                          alignSelf: 'center',
                          marginTop: 5,
                        }}>
                        {'Chuyển'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      flexGrow: 3,
                      marginHorizontal: 20,
                      justifyContent: 'space-around',
                    }}>
                    <TouchableOpacity
                      onPress={() => {
                        if (statusCall == statusCallEnum.DaKetNoi) {
                          setShowUI(showUICallEnum.UIDialer);
                        }
                      }}>
                      <Icon
                        type="material"
                        name="dialpad"
                        iconStyle={{
                          color:
                            statusCall == statusCallEnum.DaKetNoi
                              ? '#fff'
                              : '#aaa',
                          fontSize: 27,
                          alignSelf: 'center',
                        }}
                      />
                      <Text
                        style={{
                          color:
                            statusCall == statusCallEnum.DaKetNoi
                              ? '#fff'
                              : '#aaa',
                          alignSelf: 'center',
                          marginTop: 5,
                        }}>
                        {'Bàn phím'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        if (statusCall == statusCallEnum.DaKetNoi) {
                          onHold(!isHold, 1);
                        }
                      }}>
                      {isHold ? (
                        <View>
                          <Icon
                            type="fontisto"
                            name="pause"
                            iconStyle={{
                              color:
                                statusCall == statusCallEnum.DaKetNoi
                                  ? '#fff'
                                  : '#aaa',
                              fontSize: 27,
                              alignSelf: 'center',
                            }}
                          />
                          <Text
                            style={{
                              color:
                                statusCall == statusCallEnum.DaKetNoi
                                  ? '#fff'
                                  : '#aaa',
                              alignSelf: 'center',
                              marginTop: 5,
                            }}>
                            {'Giữ'}
                          </Text>
                        </View>
                      ) : (
                        <View>
                          <Icon
                            type="feather"
                            name="pause"
                            iconStyle={{
                              color:
                                statusCall == statusCallEnum.DaKetNoi
                                  ? '#fff'
                                  : '#aaa',
                              fontSize: 27,
                              alignSelf: 'center',
                            }}
                          />
                          <Text
                            style={{
                              color:
                                statusCall == statusCallEnum.DaKetNoi
                                  ? '#fff'
                                  : '#aaa',
                              alignSelf: 'center',
                              marginTop: 5,
                            }}>
                            {'Giữ'}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <View
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    alignContent: 'center',
                    justifyContent: 'center',
                  }}>
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
            </View>
          </ImageBackground>
        </View>
      )}
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
    alignSelf: 'center',
    justifyContent: 'center',
    width: 70,
    height: 70,
    borderRadius: 50,
  },
  bgDanger: {
    backgroundColor: '#F32013',
  },
  btnDanger: {
    color: '#fff',
  },
});

export default CuocGoi;
