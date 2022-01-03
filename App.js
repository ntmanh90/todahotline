import React, {useState, useEffect} from 'react';
import {
  DeviceEventEmitter,
  Platform,
  View,
  PermissionsAndroid,
  AppState,
} from 'react-native';
import uuid from 'react-native-uuid';
import BackgroundTimer from 'react-native-background-timer';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import PushNotification from 'react-native-push-notification';
import VoipPushNotification from 'react-native-voip-push-notification';
import messaging from '@react-native-firebase/messaging';
import AppNavigation from './app/navigation/AppNavigation';
import * as RootNavigation from './app/navigation/RootNavigation';
import RNCallKeep from 'react-native-callkeep';
import InCallManager from 'react-native-incall-manager';
import storeData from './app/hooks/storeData';
import keyStoreData from './app/utils/keyStoreData';
import {
  getHub,
  getHubAndReconnect,
  connectServer,
  onConnected,
} from './app/hubmanager/HubManager';
import logData from './app/utils/logData';
import CuocGoiDB from './app/database/CuocGoiDB';
import CallTypeEnum from './app/hubmanager/CallTypeEnum';
import NetInfo from '@react-native-community/netinfo';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {HubConnectionState} from '@microsoft/signalr';
import {openDatabase} from 'react-native-sqlite-storage';
import typeCallEnum from './app/utils/typeCallEnum';
import BaseURL from './app/utils/BaseURL';
import AppApi from './app/api/Client';
import Toast from 'react-native-simple-toast';
import moment from 'moment';
import statusMissCallType from './app/utils/statusMissCallType';
import useSendMissCall from './app/hooks/useSendMissCall';

const isIOS = Platform.OS === 'ios';
var conn = getHubAndReconnect();
var db = openDatabase({name: 'UserDatabase.db'});
var soDienThoaiDen = '';
var _callID = '';
var appState;
var answerClick = false;
var objectStart = {id: null, mark: 1};
var objectRestart = {id: null, mark: 1};
var incomingTimeout;

BackgroundTimer.start();
if (!isIOS) {
  RNCallKeep.setup({
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
}

if (!isIOS) {
  RNCallKeep.backToForeground();
  RNCallKeep.registerPhoneAccount();
  RNCallKeep.registerAndroidEvents();
  RNCallKeep.setAvailable(true);
}

const AppSettimeout = (cb, timeout, object) => {
  if (isIOS) {
    setTimeout(() => {
      cb();
    }, timeout);
  } else {
    if (object.id) BackgroundTimer.clearTimeout(object.id);
    if (object) {
      object.id = BackgroundTimer.setTimeout(() => {
        cb();
      }, timeout);
    } else {
      BackgroundTimer.setTimeout(() => {
        cb();
      }, timeout);
    }
  }
};

const App = props => {
  const [disSignal, setDisSignal] = useState(true);
  const [isLogin, setIsLogin] = useState('false');
  const [callUUIDHienTai, setCallUUIDHienTai] = useState('');

  const sendMissCallHook = useSendMissCall();

  const handleEndCall = async () => {
    storeData.setStoreDataValue(keyStoreData.nguoiGoiTuHangUp, false);
    storeData.setStoreDataValue(keyStoreData.callUUID, '');
    soDienThoaiDen = '';
    stopIncomingTimeout();

    // if(isIOS) {
    //   setTimeout(async () => {
    //     endstuckcall(0);
    //   }, 100);
    // }
  };

  const endstuckcall = async function(count) {
    let allCalls = [];
    allCalls = await RNCallKeep.getCalls();
    if(allCalls.length > 0 && count <= 10) {
      count ++;
      allCalls.map(item => {
        logData.writeLogData('handleStuckCall: uuid  + ' + item.callUUID);
        RNCallKeep.endCall(item.callUUID);
        RNCallKeep.reportEndCallWithUUID(item.callUUID, 1);
      });

      setTimeout(async () => {
        endstuckcall(count);
      }, 100);
    }
  }

  const displayIncomingCall = async () => {
    RNCallKeep.registerPhoneAccount();
    //RNCallKeep.toggleAudioRouteSpeaker(_callID, false);

    conn = getHubAndReconnect();
    logData.writeLogData('[displayIncomingCall]');
    const callUUID = uuid.v4().toLowerCase();
    console.log('[CallUUIDHienTai]', callUUIDHienTai.toString());
    setCallUUIDHienTai(callUUID);
    soDienThoaiDen = await storeData.getStoreDataValue(
      keyStoreData.soDienThoaiDen,
    );
    let hoTen = soDienThoaiDen;

    try {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM DanhBa WHERE so_dien_thoai = ?',
          [soDienThoaiDen],
          (tx, {rows}) => {
            console.log('getHoTenTheoSoDienThoai', rows);
            if (rows.length > 0) {
              if (rows.item(0).ho_ten) {
                hoTen = rows.item(0).ho_ten;
                storeData.setStoreDataValue(
                  keyStoreData.hoTenDienThoaiDen,
                  hoTen,
                );
              }
            }
          },
          (tx, error) => {
            console.log('Error list cuoc goi: ', error, tx);
          },
        );
      });
    } catch (err) {
      console.log(err);
    }

    console.log('[displayIncomingCall], SDT: ' + soDienThoaiDen);
    logData.writeLogData('[displayIncomingCall], SDT: ' + soDienThoaiDen);

    conn
      .invoke('ConfirmEvent', 'IncomingCallAsterisk', _callID)
      .catch(error => console.log(error));
    if (!isIOS) {
      RNCallKeep.backToForeground();
          setTimeout(() => {
            RNCallKeep.displayIncomingCall(
              callUUID,
              soDienThoaiDen,
              hoTen,
              'number',
              false,
            );
            startIncomingTimeout();
          }, 500);
          PushNotification.removeAllDeliveredNotifications();
    }
  };

  const startIncomingTimeout = async () => {
    if(incomingTimeout) clearTimeout(incomingTimeout);
    incomingTimeout = setTimeout(async () => {
      let callUIID = await storeData.getStoreDataValue(keyStoreData.callUUID);
      logData.writeLogData('[CallEnded timeout]');
     
      if (callUIID) {
        //let callUID = await storeData.getStoreDataValue(keyStoreData.callUUID);

        if (isIOS) {
          RNCallKeep.endCall(callUIID);
          RNCallKeep.reportEndCallWithUUID(callUIID, 3);
          console.log('[CallEnded server End Single Call]');
        } else {
          RNCallKeep.endAllCalls('[CallEnded server End All Call]');
          console.log('[CallEnded server End all Call]');
        }
      }
      else
      {
        RNCallKeep.endAllCalls();
        console.log('[CallEnded uiid null End all Call]');
      }
    }, 30000);
  }

  const stopIncomingTimeout = async () => {
    if(incomingTimeout) clearTimeout(incomingTimeout);
  }

  const _handleAppStateChange = async nextAppState => {
    if (
      (appState == 'inactive' || appState == 'background') &&
      nextAppState === 'active'
    ) {
      let isLoginData = await storeData.getStoreDataValue('isLogin');
      setIsLogin(isLoginData);
      if (isLoginData !== 'true') {
        RootNavigation.navigate('Login');
      } else {
        AppSettimeout(
          () => {
            connectServer();
          },
          300,
          objectRestart,
        );
      }

      logData.writeLogData('App has come to the foreground!');
    }

    appState = nextAppState;
  };

  const audioSessionActivated = async (data) => { 
    logData.writeLogData('[audioSessionActivated]');
  };

  const answerCall = async ({callUUID}) => {
    console.log('[AnswerCall - Click]');
    logData.writeLogData('[AnswerCall - Click]');
    storeData.setStoreDataValue(keyStoreData.isAnswerCall, true);
    let sdt = soDienThoaiDen = await storeData.getStoreDataValue(
      keyStoreData.soDienThoaiDen
    );

    if (!isIOS) {
      //RNCallKeep.setCurrentCallActive(callUUID);
      RNCallKeep.backToForeground();
      // setTimeout(() => {
      //   RNCallKeep.toggleAudioRouteSpeaker(callUUID, false);
      // }, 150);
    } else {
      storeData.setStoreDataValue(keyStoreData.isAnswerCall, true);
      storeData.setStoreDataValue(keyStoreData.callUUID, callUUID.toString());
      InCallManager.start({media: 'audio', ringback: '_BUNDLE_'});
    }

    if (isIOS) {
      if (!sdt || sdt == '') {
        let timeOut = 0;
        let timeInterval = setInterval(async () => {
          timeOut = timeOut + 100;
          sdt = await storeData.getStoreDataValue(
            keyStoreData.soDienThoaiDen
          );
          
          if (sdt && sdt != '') {
            clearInterval(timeInterval);
            logData.writeLogData('[[Interval] | answerCall], So dien thoai den: ' + sdt);
            RootNavigation.navigate('CuocGoi');
          }

          if (timeOut > 3000) {
            clearInterval(timeInterval);
          }
        }, 100);
      } else {
        logData.writeLogData('[On answerCall], So dien thoai den: ' + sdt);
        RootNavigation.navigate('CuocGoi');
      }
    } else {
      RootNavigation.navigate('CuocGoi');
    }
  };

  const endCall = async ({callUUID}) => {
    console.log('[Endcall click]', callUUID);
    logData.writeLogData('[EndCall click]');
    conn = getHubAndReconnect();
    const sdt = await storeData.getStoreDataValue(keyStoreData.soDienThoaiDen);
    let sessionCallId = await storeData.getStoreDataValue(
      keyStoreData.SessionCallId,
    );
    let isAnswerCall = await storeData.getStoreDataValue(
      keyStoreData.isAnswerCall,
    );

    if (isAnswerCall === 'true') {
      conn
        .invoke('hangUp', sessionCallId)
        .then(() => {
          logData.writeLogData('Invoke: hangUp | App, SDT: ' + sdt);
        })
        .catch(error => console.log(error));
      Toast.showWithGravity('Kết thúc cuộc gọi.', Toast.LONG, Toast.BOTTOM);
    } else {
      CuocGoiDB.addCuocGoi(sdt, CallTypeEnum.MissingCall);
      conn
        .invoke('AnswerCallAsterisk', false, null, sessionCallId)
        .then(() => {
          logData.writeLogData(
            'Invoke: AnswerCallAsterisk | App | [false]: từ chối SĐT' + sdt,
          );
        })
        .catch();
      let nguoiGoiHangUp = await storeData.getStoreDataValue(
        keyStoreData.nguoiGoiTuHangUp,
      );
      if (nguoiGoiHangUp == 'true') {
        sendMissCallHook.request(sdt, statusMissCallType.NguoiGoiKetThuc);
      } else {
        sendMissCallHook.request(sdt, statusMissCallType.DTVKetThuc);
      }
      Toast.showWithGravity('Kết thúc cuộc gọi.', Toast.LONG, Toast.BOTTOM);
    }

    if (isIOS) {
      if (callUUID) {
        RNCallKeep.endCall(callUUID);
      } else {
        RNCallKeep.endAllCalls();
      }
    }

    storeData.setStoreDataValue(keyStoreData.isAnswerCall, false);
    handleEndCall();
  };

  const requestUserPermission = async () => {
    if (isIOS) {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Authorization status:', authStatus);
      }
    }
  };

  const checkLogin = async () => {
    let isLoginData = await storeData.getStoreDataValue('isLogin');
    setIsLogin(isLoginData);
    if (isLoginData !== 'true') {
      RootNavigation.navigate('Login');
    }
  };

  const sendLog = async () => {
    let somayle = await storeData.getStoreDataValue(keyStoreData.somayle);
    let tenct = await storeData.getStoreDataValue(keyStoreData.tenct);
    let idnhanvien = await storeData.getStoreDataValue(keyStoreData.idnhanvien);
    let urlApi = await storeData.getStoreDataValue(keyStoreData.urlApi);
    var url = urlApi + BaseURL.URL_SEND_LOG;

    let dataLog = '';
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM Log ORDER BY id DESC',
        [],
        (tx, {rows}) => {
          if (rows.length > 0) {
            let term = [];
            for (let i = 0; i < rows.length; i++) {
              let date = new Date(rows.item(i).logTime);
              let itemLog = {
                logType: rows.item(i).logType,
                logTime: moment(date).format('DD/mm/yyyy HH:mm:ss SSS'),
                index: rows.item(i).id,
              };
              term.push(itemLog);
            }

            // dataLog = JSON.stringify(term);
            //console.log('[dataLog]', dataLog);

            var params = {
              mact: tenct,
              idnhanvien: idnhanvien,
              somayle: somayle,
              log: dataLog,
            };

            AppApi.RequestPOST(url, params, '', (err, json) => {
              if (!err) {
                logData.writeLogData('Send Log to server');
              }
            });
          } else {
            var params = {
              mact: tenct,
              idnhanvien: idnhanvien,
              somayle: somayle,
              log: '',
            };

            AppApi.RequestPOST(url, params, '', (err, json) => {
              if (!err) {
                logData.writeLogData('Send Log to server');
              }
            });
          }
        },
        (tx, error) => {
          console.log('error list Log', tx, error);
        },
      );
    });
  };

  //conn.off('SendMessage');
  conn.on('SendMessage', (sentUser, message) => {
    console.log('[Message server trả về]');
    AppSettimeout(() => {
      Toast.showWithGravity(message, Toast.LONG, Toast.BOTTOM);
    }, 1000);
  });

  if (!isIOS) {
    conn.off('IncomingCallAsterisk');
    conn.on('IncomingCallAsterisk', (callid, number, displayname, data, id) => {
      console.log('[[On]] IncomingCallAsterisk App] SDT: ' + number);
      RNCallKeep.backToForeground();
      logData.writeLogData('[[On]] IncomingCallAsterisk App] SDT: ' + number);
      var signal = JSON.parse(data);
      storeData.setStoreDataObject(keyStoreData.signalWebRTC, signal);
      storeData.setStoreDataValue(keyStoreData.callid, callid);
      _callID = callid;

      let sdt_incoming = number;
      storeData.getStoreDataValue(keyStoreData.Prefix).then(prefix => {
        sdt_incoming = number.replace(prefix, '');
        soDienThoaiDen = sdt_incoming;
        storeData.setStoreDataValue(keyStoreData.soDienThoaiDen, sdt_incoming);
        storeData.setStoreDataValue(
          keyStoreData.hoTenDienThoaiDen,
          sdt_incoming,
        );
        storeData.setStoreDataValue(
          keyStoreData.typeCall,
          typeCallEnum.IncomingCall,
        );
        displayIncomingCall();
      });
    });
  }

  conn.off('callEnded');
  conn.on('callEnded', async (callid, code, reason, id) => {
    if (_callID == callid) {
      storeData
        .getStoreDataValue(keyStoreData.isAnswerCall)
        .then(isAnswerCall => {
          if (!isAnswerCall) return;
          if (isAnswerCall == 'false') {
            console.log('[sendMissCallToServer] APP');
            storeData.setStoreDataValue(keyStoreData.nguoiGoiTuHangUp, true);
          }
        });
      if (!isIOS) {
        console.log('[CallEnded server Android]');
        conn
          .invoke('ConfirmEvent', 'callEnded', callid)
          .catch(error => console.log(error));
        RNCallKeep.endAllCalls();
      } else {
        InCallManager.stop({busytone: '_DEFAULT_'});

        let callUID = await storeData.getStoreDataValue(keyStoreData.callUUID);

        // if (callUID) {
        //   RNCallKeep.endCall(callUID);
        // } else {
        //   RNCallKeep.endAllCalls();
        // }

        let allCalls = [];
        allCalls = await RNCallKeep.getCalls();
        if (allCalls.length > 0) {
          logData.writeLogData('handleEndCall: allCalls  + ' + allCalls.length);
          allCalls.map(item => {
            RNCallKeep.endCall(item.callUUID);
            RNCallKeep.reportEndCallWithUUID(item.callUUID, 2);
          });
        } else {
          RNCallKeep.endAllCalls();
        }

        conn
          .invoke('ConfirmEvent', 'callEnded', callid)
          .catch(error => console.log(error));
      }

      Toast.showWithGravity(reason, Toast.LONG, Toast.BOTTOM);
    }
  });

  conn.off('MissedCall');
  conn.on('MissedCall', (number, name) => {
    conn
      .invoke('ConfirmEvent', 'MissedCall', null)
      .catch(error => console.log(error));
    CuocGoiDB.addCuocGoi(number, CallTypeEnum.MissingCall);
    logData.writeLogData(
      '[[On] : MissedCall] | App, SDT: ' + JSON.stringify(number),
    );
    Toast.showWithGravity('Cuộc gọi nhỡ: ' + number, Toast.LONG, Toast.BOTTOM);
  });

  /// Kết thúc xử lý kết nối signalR ////
  useEffect(() => {
    var objCallid = storeData.getStoreDataValue(keyStoreData.callid);
    if (objCallid) _callID = objCallid.toString();
    //RNCallKeep.endAllCalls();
    requestUserPermission();

    PushNotification.configure({
      // (optional) Called when Token is generated (iOS and Android)
      onRegister: function (token) {
        console.log('TOKEN:', token);
      },

      // (required) Called when a remote is received or opened, or local notification is opened
      onNotification: function (notification) {
        conn = getHubAndReconnect();

        console.log('[NOTIFICATION 1]:', notification);

        if (notification.data.type == 'wakeup') {
          if (!isIOS) {
            logData.writeLogData('[Wakeup]');
            setTimeout(() => {
              let paramNotiData = {
                uniqueid: notification.data.uniqueid,
                channel: notification.data.channel,
                thoiGianCuocGoiDen: moment(new Date()).format(
                  'YYYY-MM-DD HH:mm:ss',
                ),
              };
              console.log('[paramNotiData]', paramNotiData);
              storeData.setStoreDataObject(
                keyStoreData.paramNoti,
                paramNotiData,
              );
            }, 200);
          }
        }
        if (notification.data.type == 'DangXuat') {
          console.log('[App Dang Xuat]');
          storeData.setStoreDataValue(keyStoreData.isLogin, false);
          storeData.setStoreDataObject('sip_user', {});
          storeData.setStoreDataValue('tennhanvien', '');
          storeData.setStoreDataValue('isLogin', false);

          //conn.invoke('SignOut').catch();
          conn.stop();
          RootNavigation.navigate('Login');
        }
        if (notification.data.type == 'log') {
          sendLog();
        }

        // process the notification
        // (required) Called when a remote is received or opened, or local notification is opened
        notification.finish(PushNotificationIOS.FetchResult.NoData);
      },

      // (optional) Called when Registered Action is pressed and invokeApp is false, if true onNotification will be called (Android)
      onAction: function (notification) {
        conn = getHubAndReconnect();
        console.log('ACTION:', notification.action);
        console.log('NOTIFICATION:', notification);

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
    AppSettimeout(
      () => {
        onConnected(() => {
          //console.log("OnConnected setDisSignal.");
          setDisSignal(false);
        });

        var checkIsLogin = storeData.getStoreDataObject(keyStoreData.isLogin);
        if (checkIsLogin) {
          //console.log("Reconnect Server nè.")
          connectServer();
        }
      },
      300,
      objectStart,
    );

    conn.onclose(e => {
      console.log('Mất kết nối server.');
      AppSettimeout(
        () => {
          connectServer();
        },
        300,
        objectRestart,
      );

      setDisSignal(true);
    });

    AppState.addEventListener('change', _handleAppStateChange);

    let subscription = DeviceEventEmitter.addListener(
      'displayIncomingCallEvent',
      displayIncomingCall,
    );

    RNCallKeep.addEventListener('answerCall', answerCall);
    RNCallKeep.addEventListener('endCall', endCall);
    RNCallKeep.addEventListener('didActivateAudioSession', audioSessionActivated);

    return () => {
      conn.off('IncomingCallAsterisk');
      conn.off('callEnded');
      RNCallKeep.removeEventListener('answerCall');
      RNCallKeep.removeEventListener('endCall');
      RNCallKeep.removeEventListener('didActivateAudioSession');
      if (objectRestart.id) BackgroundTimer.clearTimeout(objectRestart.id);
      if (objectStart.id) BackgroundTimer.clearTimeout(objectStart.id);
      BackgroundTimer.stop();
      subscription.remove();
      AppState.removeEventListener('change', _handleAppStateChange);
      // Unsubscribe
      //unsubscribe_NetInfo();
    };
  }, []);

  const VoipAddListenNotification = function() {
    VoipPushNotification.addEventListener('notification', notification => {
      // --- when receive remote voip push, register your VoIP client, show local notification ... etc
      console.log('[Voip putkit gửi về]', notification);

      logData.writeLogData('[Wakeup putkit]');

      conn = getHubAndReconnect();

      conn.off('IncomingCallAsterisk');
      conn.on(
        'IncomingCallAsterisk',
        (callid, number, displayname, data, id) => {
          conn
            .invoke('ConfirmEvent', 'IncomingCallAsterisk', callid)
            .catch(error => console.log(error));
          console.log('[[On]] IncomingCallAsterisk App] SDT: ' + number);
          logData.writeLogData(
            '[[On]] IncomingCallAsterisk App] SDT: ' + number,
          );
          var signal = JSON.parse(data);
          storeData.setStoreDataObject(keyStoreData.signalWebRTC, signal);
          storeData.setStoreDataValue(keyStoreData.callid, callid);
          _callID = callid;

          let sdt_incoming = number;
          storeData.getStoreDataValue(keyStoreData.Prefix).then(prefix => {
            sdt_incoming = number.replace(prefix, '');
            soDienThoaiDen = sdt_incoming;
            storeData.setStoreDataValue(
              keyStoreData.soDienThoaiDen,
              sdt_incoming,
            );
            storeData.setStoreDataValue(
              keyStoreData.hoTenDienThoaiDen,
              sdt_incoming,
            );
            storeData.setStoreDataValue(
              keyStoreData.typeCall,
              typeCallEnum.IncomingCall,
            );
          });
        },
      );

      setTimeout(() => {
        let paramNotiData = {
          uniqueid: notification.uniqueid,
          channel: notification.uuid,
          thoiGianCuocGoiDen: moment(new Date()).format(
            'YYYY-MM-DD HH:mm:ss',
          ),
        };
        console.log('[paramNotiData]', paramNotiData);
        storeData.setStoreDataObject(keyStoreData.paramNoti, paramNotiData);
      }, 200);
      // --- optionally, if you `addCompletionHandler` from the native side, once you have done the js jobs to initiate a call, call `completion()`
      VoipPushNotification.onVoipNotificationCompleted(notification.uuid);
    });
  }

  useEffect(() => {
    if (isIOS) {
      console.log('[vao cau hinh push kit]');
      // --- anywhere which is most comfortable and appropriate for you,
      // --- usually ASAP, ex: in your app.js or at some global scope.

      // --- NOTE: You still need to subscribe / handle the rest events as usuall.
      // --- This is just a helper whcih cache and propagate early fired events if and only if for
      // --- "the native events which DID fire BEFORE js bridge is initialed",
      // --- it does NOT mean this will have events each time when the app reopened.

      // ===== Step 1: subscribe `register` event =====
      // --- this.onVoipPushNotificationRegistered
      VoipPushNotification.addEventListener('register', token => {
        // --- send token to your apn provider server
        storeData.setStoreDataValue('tokenPuskit', token);
      });

      // ===== Step 2: subscribe `notification` event =====
      // --- this.onVoipPushNotificationiReceived
      VoipAddListenNotification();

      // ===== Step 3: subscribe `didLoadWithEvents` event =====
      VoipPushNotification.addEventListener('didLoadWithEvents', events => {
        // --- this will fire when there are events occured before js bridge initialized
        // --- use this event to execute your event handler manually by event type
        console.log('[putkit gửi về 2]');

        if (!events || !Array.isArray(events) || events.length < 1) {
          return;
        }
        for (let voipPushEvent of events) {
          let {name, data} = voipPushEvent;
          // console.log('[voipPushEvent]',voipPushEvent)

          if (
            name ===
            VoipPushNotification.RNVoipPushRemoteNotificationsRegisteredEvent
          ) {
            // onVoipPushNotificationRegistered(data);
          } else if (
            name ===
            VoipPushNotification.RNVoipPushRemoteNotificationReceivedEvent
          ) {
            // onVoipPushNotificationiReceived(data);
          }
        }
      });

      // ===== Step 4: register =====
      // --- it will be no-op if you have subscribed before (like in native side)
      // --- but will fire `register` event if we have latest cahced voip token ( it may be empty if no token at all )
      VoipPushNotification.registerVoipToken(); // --- register token

      return () => {
        VoipPushNotification.removeEventListener('didLoadWithEvents');
        VoipPushNotification.removeEventListener('register');
        VoipPushNotification.removeEventListener('notification');
      };
    }
  }, []);

  useEffect(() => {
    if (!isIOS) {
      RNCallKeep.registerPhoneAccount();
    }

    checkLogin();
  }, [isLogin]);

  return (
    <>
      <AppNavigation />
      {disSignal === false ? null : (
        <>
          <View style={{position: 'absolute', top: 8, right: 8}}>
            <MaterialCommunityIcon name="signal-off" size={18} color="red" />
          </View>
          {/* <ProgressApp /> */}
        </>
      )}
    </>
  );
};

export default App;
