import React, { useState, useEffect } from 'react';
import {
  DeviceEventEmitter, Platform, View
} from 'react-native';
import uuid from 'uuid';
import BackgroundTimer from 'react-native-background-timer';
import PushNotificationIOS from "@react-native-community/push-notification-ios";
import PushNotification from "react-native-push-notification";
import messaging from "@react-native-firebase/messaging";
import AppNavigation from './app/navigation/AppNavigation';
import * as RootNavigation from './app/navigation/RootNavigation';
import RNCallKeep from 'react-native-callkeep';
import storeData from './app/hooks/storeData';
import logSignalR from './app/utils/customLogSignalR';
import keyStoreData from './app/utils/keyStoreData';
import { RTCPeerConnection, mediaDevices, RTCSessionDescription, } from 'react-native-webrtc';
import { getHub, getHubAndReconnect } from './app/hubmanager/HubManager';
import logData from './app/utils/logData';
import cuocGoi from './app/database/CuocGoi';
import CallTypeEnum from './app/hubmanager/CallTypeEnum';
import NetInfo from "@react-native-community/netinfo";
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { HubConnectionState } from '@microsoft/signalr';
import { openDatabase } from 'react-native-sqlite-storage';

const isIOS = Platform.OS === 'ios';
var conn = getHubAndReconnect();
var db = openDatabase({ name: 'UserDatabase.db' });
var interValBitRateApp = 0;
var bitratePrew = 0;
var pearConnection = null;
var callUUIDHienTai = '';

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
    //additionalPermissions: [PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE],
    foregroundService: {
      channelId: 'com.lachong.toda',
      channelName: 'Foreground service for my app',
      notificationTitle: 'My app is running on background',
      notificationIcon: 'Path to the resource icon of the notification',
    },
  },
});
if (!isIOS) {
  RNCallKeep.backToForeground();
  RNCallKeep.registerPhoneAccount();
  RNCallKeep.registerAndroidEvents();
  RNCallKeep.setAvailable(true);
}

const getNewUuid = () => uuid.v4().toLowerCase();

const format = uuid => uuid.split('-')[0];

const App = (props) => {
  const [logText, setLog] = useState('');
  const [heldCalls, setHeldCalls] = useState({}); // callKeep uuid: held
  const [mutedCalls, setMutedCalls] = useState({}); // callKeep uuid: muted
  const [calls, setCalls] = useState({}); // callKeep uuid: number
  const [disSignal, setDisSignal] = useState(false);
  const [weakSignal, setWeakSignal] = useState(false);

  const resetState = () => {
    setCalls({});
    setLog('');
    setHeldCalls({});
    setMutedCalls({});
    callUUIDHienTai = '';
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

  const displayIncomingCall = async () => {
    conn = getHubAndReconnect();

    if (interValBitRateApp != 0)
      BackgroundTimer.clearInterval(interValBitRateApp);

    console.log('da gọi vào hàm hiển thị cuoc goi');
    const callUUID = getNewUuid();
    callUUIDHienTai = callUUID;

    const number = await storeData.getStoreDataValue(keyStoreData.soDienThoaiDen);
    logData.writeLogData('Đã hiển thị màn hình cuộc gọi: displayIncomingCall, số gọi đến: ' + number);
    let hoTen = number;

    db.transaction((tx) => {
      tx.executeSql("SELECT * FROM DanhBa WHERE so_dien_thoai = ?", [number],
        (tx, { rows }) => {
          console.log('getHoTenTheoSoDienThoai', rows);
          if (rows.length > 0) {
            hoTen = rows.item(0).ho_ten;
            storeData.setStoreDataValue(keyStoreData.hoTenDienThoaiDen, hoTen);
          }
          else {
            storeData.setStoreDataValue(keyStoreData.hoTenDienThoaiDen, hoTen);
          }
        },
        (tx, error) => {
          console.log('Error list cuoc goi: ', error, tx);
        }
      );
    });

    console.log('soDienThoai incoming call', number);
    addCall(callUUID, number);

    log(`[displayIncomingCall] ${format(callUUID)}, number: ${number}`);
    RNCallKeep.displayIncomingCall(callUUID, number, hoTen, 'number', false);
  };

  const answerCall = async ({ callUUID }) => {

    const number = calls[callUUID];
    logData.writeLogData('Đã nhấn trả lời cuộc gọi đến : ' + number);
    //const sdt = await storeData.getStoreDataValue(keyStoreData.soDienThoaiDen);
    const hoTen = await storeData.getStoreDataValue(keyStoreData.hoTenDienThoaiDen);

    cuocGoi.addCuocGoi(hoTen, number, CallTypeEnum.IncomingCall);
    log(`[answerCall] ${format(callUUID)}, number: ${number}`);
    let signalData = await storeData.getStoreDataObject(keyStoreData.signalWebRTC);
    let SessionCallId = await storeData.getStoreDataValue(keyStoreData.SessionCallId);
    storeData.setStoreDataValue(keyStoreData.isAnswerCall, true);
    incomingcall(new RTCSessionDescription(signalData.sdp), SessionCallId);
    RNCallKeep.startCall(callUUID, number, hoTen);
    BackgroundTimer.setTimeout(() => {
      log(`[setCurrentCallActive] ${format(callUUID)}, number: ${number}`);
      RNCallKeep.setCurrentCallActive(callUUID);
    }, 500);

    if (interValBitRateApp != 0)
      BackgroundTimer.clearInterval(interValBitRateApp);
    interValBitRateApp = BackgroundTimer.setInterval(() => {
      if (pearConnection) {
        getTinHieu();
      }
    }, 1500);
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
    RootNavigation.navigate('CuocGoi', { soDienThoai: handle, hoTen: handle })
    // RNCallKeep.startCall(callUUID, handle, handle);

    // BackgroundTimer.setTimeout(() => {
    //   log(`[setCurrentCallActive] ${format(callUUID)}, number: ${handle}`);
    //   RNCallKeep.setCurrentCallActive(callUUID);
    // }, 1000);
  };

  const didPerformSetMutedCallAction = ({ muted, callUUID }) => {

    const number = calls[callUUID];
    log(`[didPerformSetMutedCallAction] ${format(callUUID)}, number: ${number} (${muted})`);

    setCallMuted(callUUID, muted);
  };

  const didToggleHoldCallAction = async ({ hold, callUUID }) => {
    let sessionCallId = await storeData.getStoreDataValue(keyStoreData.SessionCallId);
    const number = calls[callUUID];

    log(`[didToggleHoldCallAction] ${format(callUUID)}, number: ${number} (${hold})`);
    setCallHeld(callUUID, hold);
    if (hold === true) {
      try {
        conn.invoke("Hold", sessionCallId);
      } catch (error) {

      }
    }
    else {
      try {
        conn.invoke("UnHold", sessionCallId);
      } catch (error) {

      }
    }
  };

  const endCall = async ({ callUUID }) => {
    if (interValBitRateApp != 0)
      BackgroundTimer.clearInterval(interValBitRateApp);

    console.log('event endCall App');
    const handle = calls[callUUID];
    log(`[endCall] ${format(callUUID)}, number: ${handle}`);
    let sessionCallId = await storeData.getStoreDataValue(keyStoreData.SessionCallId);
    let isAnswerCall = await storeData.getStoreDataValue(keyStoreData.isAnswerCall);
    console.log('isAnswerCall', isAnswerCall);
    if (isAnswerCall === 'true')
      conn.invoke('hangUp', sessionCallId).then(() => {
        logData.writeLogData('Invoke: hangUp | App, số điện thoại đến: ' + handle);
      }).catch((error) => console.log(error));
    else {
      const sdt = await storeData.getStoreDataValue(keyStoreData.soDienThoaiDen);
      const hoTen = await storeData.getStoreDataValue(keyStoreData.hoTenDienThoaiDen);
      cuocGoi.addCuocGoi(hoTen, sdt, CallTypeEnum.MissingCall);
      console.log('AnswerCallAsterisk App');
      conn.invoke('AnswerCallAsterisk', false, null, sessionCallId).then(() => {
        logData.writeLogData('endCall -> Invoke: AnswerCallAsterisk | App: false từ chối cuộc gọi: ' + sdt);
      }).catch();
    }

    RNCallKeep.endCall(callUUID);
    removeCall(callUUID);
    resetState();
    storeData.setStoreDataValue(keyStoreData.isAnswerCall, false);
  };

  const hangup = async (callUUID) => {
    console.log('event hang up');

    RNCallKeep.endCall(callUUID);
    let sessionCallId = await storeData.getStoreDataValue(keyStoreData.SessionCallId);
    let soDienThoaiDen = await storeData.getStoreDataValue(keyStoreData.soDienThoaiDen);
    conn.invoke('hangUp', sessionCallId).then(() => {
      logData.writeLogData('hangup -> invoke: hangup | App, số điện thoại gọi đến: ' + soDienThoaiDen);
    }).catch((error) => console.log(error));
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

  const updateDisplay = (callUUID, displayName, number) => {
    console.log('callUUID: ', callUUID);
    // Workaround because Android doesn't display well displayName, se we have to switch ...
    if (isIOS) {
      RNCallKeep.updateDisplay(callUUID, displayName, number);
    } else {
      RNCallKeep.updateDisplay(callUUID, number, displayName);
    }

    log(`[updateDisplay: ${number}] ${format(callUUID)}`);
  };

  const requestUserPermission = async () => {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      log('Authorization status:', authStatus);
    }
  }

  const checkLogin = async () => {
    let isLoginData = await storeData.getStoreDataValue('isLogin');
    console.log('isLoginData', isLoginData);
    if (isLoginData !== 'true') {
      console.log('chuyển đến trang login');
      RootNavigation.navigate('Login');
    }
  }

  //Handle WebRTC
  const callbackIceCandidateJanus = (evt, callid) => {
    console.log('callbackIceCandidateJanus');
    if (evt.candidate) {
      //Found a new candidate
      Januscandidates.push(JSON.stringify({ candidate: evt.candidate }));
      console.log('Januscandidates', Januscandidates);
    } else {
      try {
        logSignalR.clientCallServer('SendCandidate');
        console.log('callid', callid);
        conn.invoke('SendCandidate', Januscandidates, callid).then(() => {
          logData.writeLogData('invoke: SendCandidate | App ');
        });
      } catch (error) {
        console.log('Call server Error callbackIceCandidateJanus Error: ', error);
      }
      Januscandidates = new Array();
    }
  };


  const callbackIceCandidateJanusError = (err) => {
    if (err) {
      console.log(err);
    }
  };

  const getTinHieu = async () => {
    let hoTenDienThoaiDen = await storeData.getStoreDataValue(keyStoreData.hoTenDienThoaiDen);
    let soDienThoaiDen = await storeData.getStoreDataValue(keyStoreData.soDienThoaiDen);
    if (pearConnection) {
      pearConnection.getStats(null).then(stats => {
        stats.forEach(report => {
          if (report.type === 'inbound-rtp' && report.mediaType === 'audio') {
            const bitrate = report.bytesReceived;
            console.log('bitrate: ', bitrate);
            if (bitrate - bitratePrew <= 4) {
              //kết nối yếu
              setWeakSignal(true);
            }
            else if (bitrate - bitratePrew == 0) {
              //không có kết nối
              setWeakSignal(true);
            }
            else {
              //kết nối tốt
              setWeakSignal(false);
            }

            bitratePrew = bitrate;
          }
        });
      });
    }
  }

  const incomingcall = async (sdp, sessionCall) => {
    console.log('incomingcall', sessionCall, sdp);
    let stream = await mediaDevices.getUserMedia(webrtcConstraints);
    var connection = new RTCPeerConnection(configuration);
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
                pearConnection = connection;
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

  //End handle WebRTC

  conn.onclose((e) => {
    console.log('onclose');
    //logData.writeLogData('Disconnect server: event onclose');
    setDisSignal(true);
  });

  conn.off('SendMessage');
  conn.on("SendMessage", (sentUser, message) => {
    alert(message);
  });

  conn.off('IncomingCallAsterisk')
  conn.on('IncomingCallAsterisk', (callid, number, displayname, data, id) => {
    console.log('Cuộc gọi đến IncomingCallAsterisk | App: ', displayname);
    logData.writeLogData('Cuộc gọi đến IncomingCallAsterisk | số điện thoại gọi đến: ' + number);
    logSignalR.serverCallClient('IncomingCallAsterisk');
    let sdt_incoming = number;
    storeData.getStoreDataValue(keyStoreData.Prefix).then((prefix) => {
      console.log('prefix: ', prefix);
      sdt_incoming = number.replace(prefix, "");
      console.log('sdt_incoming: ', sdt_incoming);
      storeData.setStoreDataValue(keyStoreData.soDienThoaiDen, sdt_incoming);
    });

    var signal = JSON.parse(data);
    storeData.setStoreDataObject(keyStoreData.signalWebRTC, signal);
    storeData.setStoreDataValue(keyStoreData.callid, callid);
    displayIncomingCall();
  });

  conn.off('callEnded')
  conn.on('callEnded', (callid, code, reason, id) => {

    logData.writeLogData('server call client event: callEnded | App, callid: ' + callid);
    logSignalR.serverCallClient('callEnded');
    console.log('callUUIDHienTai', callUUIDHienTai);
    RNCallKeep.endCall(callUUIDHienTai);
    resetState();
  });

  conn.off('MissedCall')
  conn.on('MissedCall', (number, name) => {
    cuocGoi.addCuocGoi(name, number, CallTypeEnum.MissingCall);
    logData.writeLogData('server call client event: MissedCall | App, số điện thoại goi nhỡ: ' + number);
    console.log('bạn có cuộc gọi nhỡ: ', number, name);
  });

  //Tao bang sqlite
  const createTableDatabase = async () => {
    await cuocGoi.initTable();
  }

  /// Kết thúc xử lý kết nối signalR ////
  useEffect(() => {
    //RNCallKeep.endAllCalls();
    createTableDatabase();

    checkLogin();
    requestUserPermission();

    PushNotification.configure({
      // (optional) Called when Token is generated (iOS and Android)
      onRegister: function (token) {
        console.log("TOKEN:", token);
      },

      // (required) Called when a remote is received or opened, or local notification is opened
      onNotification: function (notification) {
        conn = getHubAndReconnect();
        console.log("NOTIFICATION:", notification);

        // process the notification

        // (required) Called when a remote is received or opened, or local notification is opened
        notification.finish(PushNotificationIOS.FetchResult.NoData);
      },

      // (optional) Called when Registered Action is pressed and invokeApp is false, if true onNotification will be called (Android)
      onAction: function (notification) {
        conn = getHubAndReconnect();
        console.log("ACTION:", notification.action);
        console.log("NOTIFICATION:", notification);

        // process the action
      },

      // (optional) Called when the user fails to register for remote notifications. Typically occurs when APNS is having issues, or the device is a simulator. (iOS)
      onRegistrationError: function (err) {
        console.error(err.message, err);
      },

      // IOS ONLY (optional): default: all - Permissions to register.
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      // Should the initial notification be popped automatically
      // default: true
      popInitialNotification: true,

      /**
       * (optional) default: true
       * - Specified if permissions (ios) and token (android and ios) will requested or not,
       * - if not, you must call PushNotificationsHandler.requestPermissions() later
       * - if you are not using remote notification or do not have Firebase installed, use this:
       *     requestPermissions: Platform.OS === 'ios'
       */
      requestPermissions: true,
    });

    const unsubscribe_NetInfo = NetInfo.addEventListener(state => {
      setDisSignal(true);
      conn = getHubAndReconnect();
    });


    let subscription = DeviceEventEmitter.addListener('displayIncomingCallEvent', displayIncomingCall);

    RNCallKeep.addEventListener('answerCall', answerCall);
    RNCallKeep.addEventListener('didPerformDTMFAction', didPerformDTMFAction);
    RNCallKeep.addEventListener('didReceiveStartCallAction', didReceiveStartCallAction);
    RNCallKeep.addEventListener('didPerformSetMutedCallAction', didPerformSetMutedCallAction);
    RNCallKeep.addEventListener('didToggleHoldCallAction', didToggleHoldCallAction);
    RNCallKeep.addEventListener('endCall', endCall);

    //repeat check state connect hub
    BackgroundTimer.setInterval(() => {
      if (conn.state === HubConnectionState.Disconnected) {
        //console.log('Disconnected');
        setDisSignal(true);
        conn = getHubAndReconnect();
      }
      if (conn.state === HubConnectionState.Connected) {
        //console.log('Connected');
        setDisSignal(false);
      }
    }, 3000);

    return () => {
      RNCallKeep.removeEventListener('answerCall', answerCall);
      RNCallKeep.removeEventListener('didPerformDTMFAction', didPerformDTMFAction);
      RNCallKeep.removeEventListener('didReceiveStartCallAction', didReceiveStartCallAction);
      RNCallKeep.removeEventListener('didPerformSetMutedCallAction', didPerformSetMutedCallAction);
      RNCallKeep.removeEventListener('didToggleHoldCallAction', didToggleHoldCallAction);
      RNCallKeep.removeEventListener('endCall', endCall);
      subscription.remove();

      // Unsubscribe
      unsubscribe_NetInfo();
    }

  }, []);


  return (
    <>
      <AppNavigation />
      {disSignal === false ?
        null
        :
        (
          <View style={{ position: 'absolute', top: 8, right: 8 }}>
            <MaterialCommunityIcon name="signal-off" size={18} color="red" />
          </View>
        )
      }
    </>
  );

};


export default App;