
import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, DeviceEventEmitter, Platform
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
import { getHub } from './app/hubmanager/HubManager';

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

RNCallKeep.setup({
  ios: {
    appName: 'CallKeepDemo',
  },
  android: {
    alertTitle: 'Permissions required',
    alertDescription: 'This application needs to access your phone accounts',
    cancelButton: 'Cancel',
    okButton: 'ok',
  },
});
RNCallKeep.backToForeground();

const getNewUuid = () => uuid.v4().toLowerCase();

const format = uuid => uuid.split('-')[0];

const isIOS = Platform.OS === 'ios';
var connectionRTC = null;

const App = (props) => {
  const [logText, setLog] = useState('');
  const [heldCalls, setHeldCalls] = useState({}); // callKeep uuid: held
  const [mutedCalls, setMutedCalls] = useState({}); // callKeep uuid: muted
  const [calls, setCalls] = useState({}); // callKeep uuid: number
  const [callUUIDHienTai, setCallUUIDHienTai] = useState();
  //const [connectionRTC, setConnectionRTC] = useState();

  const resetState = () => {
    setCalls({});
    setLog('');
    setHeldCalls({});
    setMutedCalls({});
    setCallUUIDHienTai('');
    connectionRTC = null;
    //setConnectionRTC(null);
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
    console.log('da gọi vào hàm hiển thị cuoc goi');
    const callUUID = getNewUuid();
    setCallUUIDHienTai(callUUID);
    const number = await storeData.getStoreDataValue('soDienThoai');
    addCall(callUUID, number);

    log(`[displayIncomingCall] ${format(callUUID)}, number: ${number}`);
    RNCallKeep.displayIncomingCall(callUUID, number, number, 'number', false);
  };

  const answerCall = async ({ callUUID }) => {
    const number = calls[callUUID];
    log(`[answerCall] ${format(callUUID)}, number: ${number}`);
    let signalData = await storeData.getStoreDataObject(keyStoreData.signalWebRTC);
    let callid = await storeData.getStoreDataValue(keyStoreData.callid);
    let SessionCallId = await storeData.getStoreDataValue(keyStoreData.SessionCallId);
    incomingcall(new RTCSessionDescription(signalData.sdp), SessionCallId);
    RNCallKeep.startCall(callUUID, number, number);
    BackgroundTimer.setTimeout(() => {
      log(`[setCurrentCallActive] ${format(callUUID)}, number: ${number}`);
      RNCallKeep.setCurrentCallActive(callUUID);
    }, 500);
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
    console.log('endCall');
    const handle = calls[callUUID];
    log(`[endCall] ${format(callUUID)}, number: ${handle}`);
    let sessionCallId = await storeData.getStoreDataValue(keyStoreData.SessionCallId);
    conn.invoke('AnswerCallAsterisk', false, null, sessionCallId).catch();
    removeCall(callUUID);
    resetState();
  };

  const hangup = async (callUUID) => {
    console.log('Từ trối cuộc gọi');
    let sessionCallId = await storeData.getStoreDataValue(keyStoreData.SessionCallId);
    conn.invoke('AnswerCallAsterisk', false, null, sessionCallId).catch();
    RNCallKeep.endCall(callUUID);
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
    if (evt.candidate) {
      //Found a new candidate
      Januscandidates.push(JSON.stringify({ candidate: evt.candidate }));
      console.log('Januscandidates', Januscandidates);
    } else {
      try {
        logSignalR.clientCallServer('SendCandidate');
        console.log('callid', callid);
        conn.invoke('SendCandidate', Januscandidates, callid);
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

  const incomingcall = async (sdp, callid) => {
    let sessionCallId = await storeData.getStoreDataValue(keyStoreData.SessionCallId);
    let stream = await mediaDevices.getUserMedia(webrtcConstraints);
    var connection = new RTCPeerConnection(configuration);
    connection.onicecandidate = (evt) =>
      callbackIceCandidateJanus(evt, callid); // ICE Candidate Callback
    connection.onicecandidateerror = (error) =>
      callbackIceCandidateJanusError(error);
    connection.addStream(stream);
    connection.setRemoteDescription(sdp).then(() => {
      try {
        console.log('connectionRTC', connectionRTC);
        connection.createAnswer().then((jsep) => {
          connection.setLocalDescription(jsep).then(() => {
            try {
              logSignalR.clientCallServer('AnswerCallAsterisk')
              conn.invoke('AnswerCallAsterisk', true, connection.localDescription.sdp, sessionCallId);
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


    //setConnectionRTC(connection);
    //connectionRTC = connection;

  }

  //End handle WebRTC

  /// Xử lý kết nối signalR /// 
  conn.off('Ping');
  conn.on('Ping', () => { });

  conn.off('IncomingCallAsterisk')
  conn.on('IncomingCallAsterisk', (callid, number, displayname, data, id) => {
    logSignalR.serverCallClient('IncomingCallAsterisk');
    storeData.setStoreDataValue(keyStoreData.soDienThoai, number);
    var signal = JSON.parse(data);
    storeData.setStoreDataObject(keyStoreData.signalWebRTC, signal);
    storeData.setStoreDataValue(keyStoreData.callid, callid);
    BackgroundTimer.setTimeout(() => {
      displayIncomingCall();
    }, 1000);
  });

  conn.off('callEnded')
  conn.on('callEnded', (callid, code, reason, id) => {
    logSignalR.serverCallClient('callEnded');
    console.log('callUUIDHienTai', callUUIDHienTai);
    resetState();
    RNCallKeep.endCall(callUUIDHienTai);
  });

  /// Kết thúc xử lý kết nối signalR ////

  useEffect(() => {
    //RNCallKeep.endAllCalls();
    checkLogin();
    requestUserPermission();

    PushNotification.configure({
      // (optional) Called when Token is generated (iOS and Android)
      onRegister: function (token) {
        console.log("TOKEN:", token);
      },

      // (required) Called when a remote is received or opened, or local notification is opened
      onNotification: function (notification) {
        console.log("NOTIFICATION:", notification);

        // process the notification

        // (required) Called when a remote is received or opened, or local notification is opened
        notification.finish(PushNotificationIOS.FetchResult.NoData);
      },

      // (optional) Called when Registered Action is pressed and invokeApp is false, if true onNotification will be called (Android)
      onAction: function (notification) {
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

    let subscription = DeviceEventEmitter.addListener('displayIncomingCallEvent', displayIncomingCall);

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
      subscription.remove();
    }

  }, []);

  return (
    <AppNavigation />
  );

};


export default App;
