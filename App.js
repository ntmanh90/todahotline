import React, { useState, useEffect } from 'react';
import {
  DeviceEventEmitter, Platform, View, PermissionsAndroid, AppState
} from 'react-native';
import uuid from 'uuid';
import BackgroundTimer from 'react-native-background-timer';
import PushNotificationIOS from "@react-native-community/push-notification-ios";
import VoipPushNotification from 'react-native-voip-push-notification';
import PushNotification from "react-native-push-notification";
import messaging from "@react-native-firebase/messaging";
import AppNavigation from './app/navigation/AppNavigation';
import * as RootNavigation from './app/navigation/RootNavigation';
import RNCallKeep from 'react-native-callkeep';
import storeData from './app/hooks/storeData';
import keyStoreData from './app/utils/keyStoreData';
import { getHub, getHubAndReconnect, connectServer, onConnected } from './app/hubmanager/HubManager';
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
import Toast from 'react-native-simple-toast';
import moment from 'moment';
import statusMissCallType from './app/utils/statusMissCallType';
import useSendMissCall from './app/hooks/useSendMissCall';

const isIOS = Platform.OS === 'ios';
var conn = getHubAndReconnect();
var db = openDatabase({ name: 'UserDatabase.db' });
var soDienThoaiDen = '';
var _callID = "";
var appState;
var reconnectTimeoutID, startTimeoutID;

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
    //selfManaged: true,
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
  console.log('Là Android đã vào mục này');
  RNCallKeep.backToForeground();
  RNCallKeep.registerPhoneAccount();
  RNCallKeep.registerAndroidEvents();
  RNCallKeep.setAvailable(true);

}

const getNewUuid = () => uuid.v4().toLowerCase();

const App = (props) => {
  const [disSignal, setDisSignal] = useState(true);
  const [isLogin, setIsLogin] = useState('false');
  const [callUUIDHienTai, setCallUUIDHienTai] = useState('');

  const sendMissCallHook = useSendMissCall();

  const handleEndCall = async () => {
    storeData.setStoreDataValue(keyStoreData.nguoiGoiTuHangUp, false);
    soDienThoaiDen = '';
  }

  const displayIncomingCall = async () => {
    if (!isIOS) {
      RNCallKeep.registerPhoneAccount();
    }
    conn = getHubAndReconnect();
    logData.writeLogData('[displayIncomingCall]');
    const callUUID = getNewUuid();
    setCallUUIDHienTai(callUUID);
    let _soDienThoaiDen = soDienThoaiDen;
    let hoTen = _soDienThoaiDen;

    try
    {
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
    }
    catch(err){
      console.log(err);
    }
    
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
      uniqueid: paramNoti ? (paramNoti.uniqueid ?? '') : '',
      channel: paramNoti ? (paramNoti.channel ?? '') : '',
    }
    let url = http + BaseURL.URL_CHECK_INCOMINGCAL;
    AppApi.RequestPOST(url, params, (err, json) => {
      logData.writeLogData('[CallAPI: checkcuocgoi] send | ', JSON.stringify(params));

      if (!err) {
        logData.writeLogData('[CallAPI: checkcuocgoi] send | result: ' + JSON.stringify(json.data.status));
        console.debug(json.data);
        if (json.data.status) {
          console.log('[Lan dau hien thi Incomming Call]');
          if(!isIOS)
          {
            RNCallKeep.toggleAudioRouteSpeaker(callUUID, false);
          }
          
          logData.writeLogData('[displayIncomingCall], SDT: ' + _soDienThoaiDen);
          RNCallKeep.displayIncomingCall(callUUID, _soDienThoaiDen, hoTen, 'number', false);
          //RNCallKeep.backToForeground();
        } else {
          console.log('[Lan dau khong hien thi duoc Incomming Call]');
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

  const _handleAppStateChange = async (nextAppState) => {
    if ((appState == "inactive" || appState == "background") && nextAppState === 'active') {
      if(reconnectTimeoutID) BackgroundTimer.clearTimeout(reconnectTimeoutID);
      let isLoginData = await storeData.getStoreDataValue('isLogin');
      setIsLogin(isLoginData);
      if (isLoginData !== 'true') {
        RootNavigation.navigate('Login');
      }
      else
      {
        reconnectTimeoutID = BackgroundTimer.setTimeout(() => {
          connectServer();
        }, 300);
      }
      
      logData.writeLogData('App has come to the foreground!');
    }

    appState = nextAppState;
  }

  const answerCall = async ({ callUUID }) => {
    console.log('[AnswerCall - Click]');
    logData.writeLogData('[AnswerCall]');
    storeData.setStoreDataValue(keyStoreData.isAnswerCall, true);
    if(!isIOS)
     {
      RNCallKeep.setCurrentCallActive(callUUID);
      RNCallKeep.backToForeground();
      BackgroundTimer.setTimeout(() => {
        RNCallKeep.toggleAudioRouteSpeaker(callUUID, false);
      }, 150);
     }

    //RNCallKeep.rejectCall();
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
      Toast.showWithGravity('Kết thúc cuộc gọi.', Toast.LONG, Toast.BOTTOM);
    }
    else {
      CuocGoiDB.addCuocGoi(sdt, CallTypeEnum.MissingCall);
      conn.invoke('AnswerCallAsterisk', false, null, sessionCallId).then(() => {
        logData.writeLogData('Invoke: AnswerCallAsterisk | App | [false]: từ chối SĐT' + sdt);
      }).catch();
      let nguoiGoiHangUp = await storeData.getStoreDataValue(keyStoreData.nguoiGoiTuHangUp);
      if (nguoiGoiHangUp == 'true') {
        sendMissCallHook.request(sdt, statusMissCallType.NguoiGoiKetThuc);
      }
      else {
        sendMissCallHook.request(sdt, statusMissCallType.DTVKetThuc);
      }
      Toast.showWithGravity('Kết thúc cuộc gọi.', Toast.LONG, Toast.BOTTOM)
    }

    RNCallKeep.endCall(callUUID);
    storeData.setStoreDataValue(keyStoreData.isAnswerCall, false);
    handleEndCall();
  };

  const requestUserPermission = async () => {
    if(isIOS)
    {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  
      if (enabled) {
        console.log('Authorization status:', authStatus);
      }
    }
  }

  const checkLogin = async () => {
    let isLoginData = await storeData.getStoreDataValue('isLogin');
    setIsLogin(isLoginData);
    if (isLoginData !== 'true') {
      RootNavigation.navigate('Login');
    }
  }

  const sendLog = async () => {
    let somayle = await storeData.getStoreDataValue(keyStoreData.somayle);
    let tenct = await storeData.getStoreDataValue(keyStoreData.tenct);
    let idnhanvien = await storeData.getStoreDataValue(keyStoreData.idnhanvien);
    let urlApi = await storeData.getStoreDataValue(keyStoreData.urlApi);
    var url = urlApi + BaseURL.URL_SEND_LOG;

    let dataLog = '';
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM Log ORDER BY id DESC',
        [],
        (tx, { rows }) => {
          if (rows.length > 0) {
            let term = [];
            for (let i = 0; i < rows.length; i++) {

              let date = new Date(rows.item(i).logTime);
              let itemLog = {
                logType: rows.item(i).logType,
                logTime: moment(date).format('DD/mm/yyyy HH:mm:ss SSS'),
                index: rows.item(i).id
              }
              term.push(itemLog);
            }

            // dataLog = JSON.stringify(term);
            //console.log('[dataLog]', dataLog);

            var params = {
              mact: tenct,
              idnhanvien: idnhanvien,
              somayle: somayle,
              log: dataLog
            };

            AppApi.RequestPOST(url, params, "", (err, json) => {
              if (!err) {
                logData.writeLogData('Send Log to server');
              }
            });

          }
          else {
            var params = {
              mact: tenct,
              idnhanvien: idnhanvien,
              somayle: somayle,
              log: ""
            };

            AppApi.RequestPOST(url, params, "", (err, json) => {
              if (!err) {
                logData.writeLogData('Send Log to server');
              }
            });
          }

        },
        (tx, error) => {
          console.log('error list Log', tx, error);;
        },
      );
    });


  }

  //conn.off('SendMessage');
  conn.on("SendMessage", (sentUser, message) => {
    console.log('[Message server trả về]');
    setTimeout(() => {
      Toast.showWithGravity(message, Toast.LONG, Toast.BOTTOM)
    }, 1000);
  });

  conn.off('IncomingCallAsterisk')
  conn.on('IncomingCallAsterisk', (callid, number, displayname, data, id) => {
    conn.invoke("ConfirmEvent", "IncomingCallAsterisk", callid).catch((error) => console.log(error));
    console.log('[[On]] IncomingCallAsterisk App] SDT: ' + number);
    logData.writeLogData('[[On]] IncomingCallAsterisk App] SDT: ' + number);
    var signal = JSON.parse(data);
    storeData.setStoreDataObject(keyStoreData.signalWebRTC, signal);
    storeData.setStoreDataValue(keyStoreData.callid, callid);
    _callID = callid;

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
    conn.invoke("ConfirmEvent", "callEnded", callid).catch((error) => console.log(error));
    if(_callID == callid)
    {
      console.log('[CallEnded server]');
      storeData.getStoreDataValue(keyStoreData.isAnswerCall).then((isAnswerCall) => {
        if (isAnswerCall == 'false') {
          console.log('[sendMissCallToServer] APP');
          storeData.setStoreDataValue(keyStoreData.nguoiGoiTuHangUp, true);
        }
      })
      RNCallKeep.endCall(callUUIDHienTai);
      Toast.showWithGravity(reason, Toast.LONG, Toast.BOTTOM)
    }
  });

  conn.off('MissedCall')
  conn.on('MissedCall', (number, name) => {
    conn.invoke("ConfirmEvent", "MissedCall", null).catch((error) => console.log(error));
    CuocGoiDB.addCuocGoi(number, CallTypeEnum.MissingCall);
    logData.writeLogData('[[On] : MissedCall] | App, SDT: ' + JSON.stringify(number));
    Toast.showWithGravity('Cuộc gọi nhỡ: ' + number, Toast.LONG, Toast.BOTTOM);
  });

  /// Kết thúc xử lý kết nối signalR ////
  useEffect(() => {
    var objCallid = storeData.getStoreDataValue(keyStoreData.callid);
    if(objCallid)
      _callID = objCallid.toString();
    //RNCallKeep.endAllCalls();
    requestUserPermission();

if(isIOS)
{
      // --- anywhere which is most comfortable and appropriate for you,
    // --- usually ASAP, ex: in your app.js or at some global scope.


      // --- NOTE: You still need to subscribe / handle the rest events as usuall.
      // --- This is just a helper whcih cache and propagate early fired events if and only if for
      // --- "the native events which DID fire BEFORE js bridge is initialed",
      // --- it does NOT mean this will have events each time when the app reopened.


      // ===== Step 1: subscribe `register` event =====
      // --- this.onVoipPushNotificationRegistered
      VoipPushNotification.addEventListener('register', (token) => {
          // --- send token to your apn provider server
          storeData.setStoreDataValue('tokenPuskit',token);
      });

      // ===== Step 2: subscribe `notification` event =====
      // --- this.onVoipPushNotificationiReceived
      VoipPushNotification.addEventListener('notification', (notification) => {
          // --- when receive remote voip push, register your VoIP client, show local notification ... etc
          console.log('[putkit wake up]');
          logData.writeLogData('[Wakeup putkit]');
          
          BackgroundTimer.setTimeout(() => {
            let paramNotiData = {
              uniqueid: notification.uniqueid,
              channel: notification.uuid,
              thoiGianCuocGoiDen: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
            };
            console.log('[paramNotiData]', paramNotiData);
            storeData.setStoreDataObject(keyStoreData.paramNoti, paramNotiData);
          }, 200);
          // --- optionally, if you `addCompletionHandler` from the native side, once you have done the js jobs to initiate a call, call `completion()`
          VoipPushNotification.onVoipNotificationCompleted(notification.uuid);
      });

      // ===== Step 3: subscribe `didLoadWithEvents` event =====
      VoipPushNotification.addEventListener('didLoadWithEvents', (events) => {
          // --- this will fire when there are events occured before js bridge initialized
          // --- use this event to execute your event handler manually by event type

          if (!events || !Array.isArray(events) || events.length < 1) {
              return;
          }
          for (let voipPushEvent of events) {
              let { name, data } = voipPushEvent;
              if (name === VoipPushNotification.RNVoipPushRemoteNotificationsRegisteredEvent) {
                  // onVoipPushNotificationRegistered(data);
              } else if (name === VoipPushNotification.RNVoipPushRemoteNotificationReceivedEvent) {
                  // onVoipPushNotificationiReceived(data);
              }
          }
      });

      // ===== Step 4: register =====
      // --- it will be no-op if you have subscribed before (like in native side)
      // --- but will fire `register` event if we have latest cahced voip token ( it may be empty if no token at all )
      VoipPushNotification.registerVoipToken(); // --- register token

      return()=>{
        VoipPushNotification.removeEventListener('didLoadWithEvents');
        VoipPushNotification.removeEventListener('register');
        VoipPushNotification.removeEventListener('notification');
      }  

}

    PushNotification.configure({
      // (optional) Called when Token is generated (iOS and Android)
      onRegister: function (token) {
        console.log("TOKEN:", token);
      },

      // (required) Called when a remote is received or opened, or local notification is opened
      onNotification: function (notification) {
        conn = getHubAndReconnect();

        console.log("[NOTIFICATION 1]:", notification);

        if (notification.data.type == 'wakeup') {
          logData.writeLogData('[Wakeup]');
          BackgroundTimer.setTimeout(() => {
            let paramNotiData = {
              uniqueid: notification.data.uniqueid,
              channel: notification.data.channel,
              thoiGianCuocGoiDen: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
            };
            console.log('[paramNotiData]', paramNotiData);
            storeData.setStoreDataObject(keyStoreData.paramNoti, paramNotiData);
          }, 200);
        }
        if (notification.data.type == "DangXuat") {
          storeData.setStoreDataValue(keyStoreData.isLogin, false);
          storeData.setStoreDataObject('sip_user', {});
          storeData.setStoreDataValue('tennhanvien', '');
          storeData.setStoreDataValue('isLogin', false);

          //conn.invoke('SignOut').catch();
          conn.stop();
          RootNavigation.navigate('Login');
        }
        if (notification.data.type == "log") {
          sendLog();
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

    appState = AppState.currentState;
    startTimeoutID = BackgroundTimer.setTimeout(() => {
      onConnected(() => {
        console.log("OnConnected setDisSignal.");
        setDisSignal(false);
      });

      var checkIsLogin = storeData.getStoreDataObject(keyStoreData.isLogin);
      if(checkIsLogin)
      {
        console.log("Reconnect Server nè.")
        connectServer();
      } 
    }, 300);

    conn.onclose((e) => {
      console.log("Mất kết nối server.");
      reconnectTimeoutID = BackgroundTimer.setTimeout(() => {
        connectServer();
      }, 300);
      
      setDisSignal(true);
    });

    AppState.addEventListener('change', _handleAppStateChange);

    let subscription = DeviceEventEmitter.addListener('displayIncomingCallEvent', displayIncomingCall);

    RNCallKeep.addEventListener('answerCall', answerCall);
    RNCallKeep.addEventListener('endCall', endCall);

    return () => {
      if(reconnectTimeoutID) BackgroundTimer.clearTimeout(reconnectTimeoutID);
      if(startTimeoutID) BackgroundTimer.clearTimeout();
      AppState.removeEventListener('change', _handleAppStateChange);
      BackgroundTimer.stop();
      RNCallKeep.removeEventListener('answerCall', answerCall);
      RNCallKeep.removeEventListener('endCall', endCall);

      subscription.remove();

      // Unsubscribe
      //unsubscribe_NetInfo();
    }

  }, []);

  useEffect(() => {
    if(!isIOS)
    {
      RNCallKeep.registerPhoneAccount();
    }
    
    checkLogin();
  }, [isLogin]);

  console.log('App is rendered!');

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