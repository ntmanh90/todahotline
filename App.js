import React, { useState, useEffect } from 'react';
import {
  DeviceEventEmitter, Platform, View, PermissionsAndroid
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
import keyStoreData from './app/utils/keyStoreData';
import { getHub, getHubAndReconnect } from './app/hubmanager/HubManager';
import logData from './app/utils/logData';
import CuocGoiDB from './app/database/CuocGoiDB';
import CallTypeEnum from './app/hubmanager/CallTypeEnum';
import NetInfo from "@react-native-community/netinfo";
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { HubConnectionState } from '@microsoft/signalr';
import { openDatabase } from 'react-native-sqlite-storage';
import typeCallEnum from './app/utils/typeCallEnum';
import BaseURL from './app/utils/BaseURL';
import AppApi from './app/api/Client';


const isIOS = Platform.OS === 'ios';
var conn = getHubAndReconnect();
var db = openDatabase({ name: 'UserDatabase.db' });
var soDienThoaiDen = '';

BackgroundTimer.start();

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
if (!isIOS) {
  RNCallKeep.backToForeground();
  RNCallKeep.registerPhoneAccount();
  RNCallKeep.registerAndroidEvents();
  RNCallKeep.setAvailable(true);
}

const getNewUuid = () => uuid.v4().toLowerCase();

const App = (props) => {
  const [disSignal, setDisSignal] = useState(false);
  const [isLogin, setIsLogin] = useState('false');
  const [callUUIDHienTai, setCallUUIDHienTai] = useState('');

  const handleEndCall = async () => {
    let paramNotiData = {
      uniqueid: "",
      channel: "",
    };
    storeData.setStoreDataObject(keyStoreData.paramNoti, paramNotiData);
    soDienThoaiDen = '';
  }

  const displayIncomingCall = async () => {
    conn = getHubAndReconnect();
    logData.writeLogData('[displayIncomingCall]');
    const callUUID = getNewUuid();
    setCallUUIDHienTai(callUUID);
    let _soDienThoaiDen = soDienThoaiDen;
    let hoTen = _soDienThoaiDen;

    db.transaction((tx) => {
      tx.executeSql("SELECT * FROM DanhBa WHERE so_dien_thoai = ?", [_soDienThoaiDen],
        (tx, { rows }) => {
          console.log('getHoTenTheoSoDienThoai', rows);
          if (rows.length > 0) {
            if (rows.item(0).ho_ten) {
              hoTen = rows.item(0).ho_ten;
              storeData.setStoreDataValue(keyStoreData.hoTenDienThoaiDen, hoTen);
            }
          }
        },
        (tx, error) => {
          console.log('Error list cuoc goi: ', error, tx);
        }
      );
    });
    //logData.writeLogData('[displayIncomingCall]: ' + _soDienThoaiDen + ", " + hoTen);
    //RNCallKeep.displayIncomingCall(callUUID, _soDienThoaiDen, hoTen, 'number', false);

    let http = await storeData.getStoreDataValue(keyStoreData.urlApi);
    let mact = await storeData.getStoreDataValue(keyStoreData.tenct);
    let somayle = await storeData.getStoreDataValue(keyStoreData.somayle);
    let paramNoti = await storeData.getStoreDataObject(keyStoreData.paramNoti);
    let prefix = await storeData.getStoreDataObject(keyStoreData.Prefix);

    var params = {
      mact: mact,
      sodich: somayle,
      songuon: _soDienThoaiDen,
      somayle: somayle,
      prefix: prefix,
      uniqueid: paramNoti.uniqueid ?? '',
      channel: paramNoti.channel ?? '',
    }
    let url = http + BaseURL.URL_CHECK_INCOMINGCAL;
    AppApi.RequestPOST(url, params, (err, json) => {
      logData.writeLogData('[CallAPI: checkcuocgoi] send | ', JSON.stringify(params));

      if (!err) {
        logData.writeLogData('[CallAPI: checkcuocgoi] send | result: ' + JSON.stringify(json.data.status));
        if (json.data.status) {
          logData.writeLogData('[displayIncomingCall], SDT: ' + _soDienThoaiDen);
          RNCallKeep.displayIncomingCall(callUUID, _soDienThoaiDen, hoTen, 'number', false);
        } else {
          CuocGoiDB.addCuocGoi(_soDienThoaiDen, CallTypeEnum.MissingCall);
          return;
        }
      }
      else {
        CuocGoiDB.addCuocGoi(_soDienThoaiDen, CallTypeEnum.MissingCall);
        return;
      }
    });
  };

  const answerCall = async ({ callUUID }) => {
    logData.writeLogData('[AnswerCall]');
    storeData.setStoreDataValue(keyStoreData.isAnswerCall, true);
    RNCallKeep.setCurrentCallActive(callUUID);
    BackgroundTimer.setTimeout(() => {
      RNCallKeep.backToForeground();
    }, 100);

    RootNavigation.navigate('CuocGoi');
  };

  const endCall = async ({ callUUID }) => {
    logData.writeLogData('[EndCall]');
    conn = getHubAndReconnect();
    const sdt = await storeData.getStoreDataValue(keyStoreData.soDienThoaiDen);
    let sessionCallId = await storeData.getStoreDataValue(keyStoreData.SessionCallId);
    let isAnswerCall = await storeData.getStoreDataValue(keyStoreData.isAnswerCall);
    if (isAnswerCall === 'true') {
      conn.invoke('hangUp', sessionCallId).then(() => {
        logData.writeLogData('Invoke: hangUp | App, SDT: ' + sdt);
      }).catch((error) => console.log(error));
    }
    else {
      CuocGoiDB.addCuocGoi(sdt, CallTypeEnum.MissingCall);
      conn.invoke('AnswerCallAsterisk', false, null, sessionCallId).then(() => {
        logData.writeLogData('Invoke: AnswerCallAsterisk | App | [false]: từ chối SĐT' + sdt);
      }).catch();
    }

    RNCallKeep.endCall(callUUID);
    storeData.setStoreDataValue(keyStoreData.isAnswerCall, false);
  };

  const requestUserPermission = async () => {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Authorization status:', authStatus);
    }
  }

  const checkLogin = async () => {
    let isLoginData = await storeData.getStoreDataValue('isLogin');
    setIsLogin(isLoginData);
    if (isLoginData !== 'true') {
      RootNavigation.navigate('Login');
    }
  }

  conn.onclose((e) => {
    conn = getHubAndReconnect();
    setDisSignal(true);
  });

  conn.off('SendMessage');
  conn.on("SendMessage", (sentUser, message) => {
    alert(message);
  });

  conn.off('IncomingCallAsterisk')
  conn.on('IncomingCallAsterisk', (callid, number, displayname, data, id) => {
    logData.writeLogData('[[On]] IncomingCallAsterisk App] SDT: ' + number);

    var signal = JSON.parse(data);
    storeData.setStoreDataObject(keyStoreData.signalWebRTC, signal);
    storeData.setStoreDataValue(keyStoreData.callid, callid);

    let sdt_incoming = number;
    storeData.getStoreDataValue(keyStoreData.Prefix).then((prefix) => {
      sdt_incoming = number.replace(prefix, "");
      soDienThoaiDen = sdt_incoming;
      storeData.setStoreDataValue(keyStoreData.soDienThoaiDen, sdt_incoming);
      storeData.setStoreDataValue(keyStoreData.hoTenDienThoaiDen, sdt_incoming);
      storeData.setStoreDataValue(keyStoreData.typeCall, typeCallEnum.IncomingCall);
      displayIncomingCall();
    });
  });

  conn.off('callEnded')
  conn.on('callEnded', (callid, code, reason, id) => {
    handleEndCall();
    logData.writeLogData('[[on] callEnded] | App, callid: ' + JSON.stringify(callid));
    RNCallKeep.endCall(callUUIDHienTai);
  });

  conn.off('MissedCall')
  conn.on('MissedCall', (number, name) => {

    CuocGoiDB.addCuocGoi(number, CallTypeEnum.MissingCall);
    logData.writeLogData('[[On] : MissedCall] | App, SDT: ' + JSON.stringify(number));
  });

  /// Kết thúc xử lý kết nối signalR ////
  useEffect(() => {
    //RNCallKeep.endAllCalls();
    requestUserPermission();

    PushNotification.configure({
      // (optional) Called when Token is generated (iOS and Android)
      onRegister: function (token) {
        console.log("TOKEN:", token);
      },

      // (required) Called when a remote is received or opened, or local notification is opened
      onNotification: function (notification) {
        conn = getHubAndReconnect();
        console.log("NOTIFICATION 1:", notification);

        if (notification.data.type == 'wakeup') {
          backgroundtimer = setTimeout(() => {
            let paramNotiData = {
              uniqueid: notification.data.uniqueid,
              channel: notification.data.channel,
            };
            storeData.setStoreDataObject(keyStoreData.paramNoti, paramNotiData);
          }, 200);
        }

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

    BackgroundTimer.setInterval(() => {
      if (conn.state !== HubConnectionState.Connected) {
        // console.log('Disconnected');
        setDisSignal(true);
        //conn = getHubAndReconnect();
      }
      if (conn.state === HubConnectionState.Connected) {
        //console.log('Connected');
        setDisSignal(false);
      }
    }, 2000);

    let subscription = DeviceEventEmitter.addListener('displayIncomingCallEvent', displayIncomingCall);

    RNCallKeep.addEventListener('answerCall', answerCall);
    RNCallKeep.addEventListener('endCall', endCall);

    return () => {
      RNCallKeep.removeEventListener('answerCall', answerCall);
      RNCallKeep.removeEventListener('endCall', endCall);

      subscription.remove();

      // Unsubscribe
      unsubscribe_NetInfo();
    }

  }, []);

  useEffect(() => {
    checkLogin();
  }, [isLogin]);

  return (
    <>
      <AppNavigation />
      {disSignal === false ?
        null
        :
        (
          <>
            <View style={{ position: 'absolute', top: 8, right: 8 }}>
              <MaterialCommunityIcon name="signal-off" size={18} color="red" />
            </View>
            {/* <ProgressApp /> */}
          </>
        )
      }
    </>
  );
};


export default App;