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
import { getHub, getHubAndReconnect } from './app/hubmanager/HubManager';
import logData from './app/utils/logData';
import CuocGoiDB from './app/database/CuocGoiDB';
import CallTypeEnum from './app/hubmanager/CallTypeEnum';
import NetInfo from "@react-native-community/netinfo";
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { HubConnectionState } from '@microsoft/signalr';
import { openDatabase } from 'react-native-sqlite-storage';
import typeCallEnum from './app/utils/typeCallEnum';

const isIOS = Platform.OS === 'ios';
var conn = getHubAndReconnect();
var db = openDatabase({ name: 'UserDatabase.db' });
var callUUIDHienTai = '';
let hoTen = "";

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

const App = (props) => {
  const [disSignal, setDisSignal] = useState(false);


  const displayIncomingCall = async () => {
    conn = getHubAndReconnect();
    const callUUID = getNewUuid();
    callUUIDHienTai = callUUID;
    const number = await storeData.getStoreDataValue(keyStoreData.soDienThoaiDen);
    hoTen = number;
    logData.writeLogData('Đã hiển thị màn hình cuộc gọi: displayIncomingCall, số gọi đến: ' + number);

    db.transaction((tx) => {
      tx.executeSql("SELECT * FROM DanhBa WHERE so_dien_thoai = ?", [number],
        (tx, { rows }) => {
          console.log('getHoTenTheoSoDienThoai', rows);
          if (rows.length > 0) {
            hoTen = rows.item(0).ho_ten;
          }
        },
        (tx, error) => {
          console.log('Error list cuoc goi: ', error, tx);
        }
      );
    });

    storeData.setStoreDataValue(keyStoreData.hoTenDienThoaiDen, hoTen);
    RNCallKeep.displayIncomingCall(callUUID, number, hoTen, 'number', false);
  };

  const answerCall = async ({ callUUID }) => {
    const sdt = await storeData.getStoreDataValue(keyStoreData.soDienThoaiDen);
    storeData.setStoreDataValue(keyStoreData.isAnswerCall, true);

    RNCallKeep.backToForeground()
    RNCallKeep.setCurrentCallActive(callUUID)
    RootNavigation.navigate('CuocGoi', { soDienThoai: sdt, hoTen: hoTen, type: typeCallEnum.IncomingCall });

  };

  const endCall = async ({ callUUID }) => {
    conn = getHubAndReconnect();
    const sdt = await storeData.getStoreDataValue(keyStoreData.soDienThoaiDen);
    let sessionCallId = await storeData.getStoreDataValue(keyStoreData.SessionCallId);
    let isAnswerCall = await storeData.getStoreDataValue(keyStoreData.isAnswerCall);
    if (isAnswerCall === 'true') {
      conn.invoke('hangUp', sessionCallId).then(() => {
        logData.writeLogData('Invoke: hangUp | App, số điện thoại đến: ' + sdt);
      }).catch((error) => console.log(error));
    }
    else {
      CuocGoiDB.addCuocGoi(hoTen, sdt, CallTypeEnum.MissingCall);
      console.log('AnswerCallAsterisk App');
      conn.invoke('AnswerCallAsterisk', false, null, sessionCallId).then(() => {
        logData.writeLogData('endCall -> Invoke: AnswerCallAsterisk | App: false từ chối cuộc gọi: ' + sdt);
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
    console.log('isLoginData', isLoginData);
    if (isLoginData !== 'true') {
      console.log('chuyển đến trang login');
      RootNavigation.navigate('Login');
    }
  }


  conn.onclose((e) => {
    //console.log('onclose');
    //logData.writeLogData('Disconnect server: event onclose');

    //repeat check state connect hub

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
    CuocGoiDB.addCuocGoi(name, number, CallTypeEnum.MissingCall);
    logData.writeLogData('server call client event: MissedCall | App, số điện thoại goi nhỡ: ' + number);
    console.log('bạn có cuộc gọi nhỡ: ', number, name);
  });

  //Tao bang sqlite
  const createTableDatabase = async () => {
    await CuocGoiDB.initTable();
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

    BackgroundTimer.setInterval(() => {
      if (conn.state !== HubConnectionState.Connected) {
        // console.log('Disconnected');
        setDisSignal(true);
        conn = getHubAndReconnect();
      }
      if (conn.state === HubConnectionState.Connected) {
        //console.log('Connected');
        setDisSignal(false);
      }
    }, 1000);

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