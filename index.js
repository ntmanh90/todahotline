import {AppRegistry, DeviceEventEmitter, Platform} from 'react-native';
import App from './App';
import messaging from '@react-native-firebase/messaging';
import {name as appName} from './app.json';
import BackgroundTimer from 'react-native-background-timer';
import storeData from './app/hooks/storeData';
import keyStoreData from './app/utils/keyStoreData';
import DeviceInfo from 'react-native-device-info';
import NetInfo from '@react-native-community/netinfo';
import {getHub, getHubAndReconnect} from './app/hubmanager/HubManager';
import BaseURL from './app/utils/BaseURL';
import logData from './app/utils/logData';
import AppApi from './app/api/Client';
import {openDatabase} from 'react-native-sqlite-storage';
import moment from 'moment';
import {isIOS} from 'react-native-elements/dist/helpers';

var db = openDatabase({name: 'UserDatabase.db'});
var conn = getHubAndReconnect();
// BackgroundTimer.start();

if (!isIOS) {
  conn.off('IncomingCallAsterisk');
  conn.on('IncomingCallAsterisk', (callid, number, displayname, data, id) => {
    conn
      .invoke('ConfirmEvent', 'IncomingCallAsterisk', callid)
      .catch(error => console.log(error));
    logData.writeLogData('[[on] | IncomingCallAsterisk], index: ' + number);
    let sdt_incoming = number;
    storeData.getStoreDataValue(keyStoreData.Prefix).then(prefix => {
      sdt_incoming = number.replace(prefix, '');
      storeData.setStoreDataValue(keyStoreData.soDienThoaiDen, sdt_incoming);
    });

    var signal = JSON.parse(data);
    storeData.setStoreDataObject(keyStoreData.signalWebRTC, signal);
    storeData.setStoreDataValue(keyStoreData.callid, callid);

    DeviceEventEmitter.emit('displayIncomingCallEvent');
  });
}

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

          dataLog = JSON.stringify(term);
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

// Register background handler
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('[remoteMessage index]', remoteMessage);
  if (!isIOS) {
    if (remoteMessage.data.type == 'wakeup') {
      conn = getHubAndReconnect();
      logData.writeLogData('[Wakeup]');
      let paramNotiData = {
        uniqueid: remoteMessage.data.uniqueid,
        channel: remoteMessage.data.channel,
        thoiGianCuocGoiDen: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
      };
      storeData.setStoreDataObject(keyStoreData.paramNoti, paramNotiData);

      let http = await storeData.getStoreDataValue(keyStoreData.urlApi);
      var url = http + 'redirect';
      console.log(url);

      NetInfo.fetch().then(async state => {
        let idct = await storeData.getStoreDataValue(keyStoreData.idct);
        let mact = await storeData.getStoreDataValue(keyStoreData.tenct);
        let idnhanvien = await storeData.getStoreDataValue(
          keyStoreData.idnhanvien,
        );
        let ext = await storeData.getStoreDataValue(keyStoreData.somayle);
        let deviceName = await DeviceInfo.getDeviceName();
        var params = {
          mact: mact,
          ext: ext,
          channel: remoteMessage.data.channel,
          uniqueid: remoteMessage.data.uniqueid,
          internet: state.type,
          idct: idct,
          idnhanvien: idnhanvien,
          ver: BaseURL.VERSION,
          os: Platform.OS == 'ios' ? 1 : 2,
          dongmay: DeviceInfo.getBrand(),
          imei: DeviceInfo.getUniqueId(),
          devicename: deviceName,
          osversion: DeviceInfo.getSystemVersion(),
        };

        AppApi.RequestPOST(url, params, (err, json) => {
          if (!err) {
            if (json.data.status) {
              logData.writeLogData(
                '[CallAPI: redirect]: Result' +
                  JSON.stringify(json.data.status),
              );
            } else {
            }
          }
        });
      });
    }
  }

  if (remoteMessage.data.type == 'DangXuat') {
    logData.writeLogData('Firebase Dang Xuat');
    storeData.setStoreDataValue(keyStoreData.isLogin, false);
    storeData.setStoreDataObject('sip_user', {});
    storeData.setStoreDataValue('tennhanvien', '');
    storeData.setStoreDataValue('isLogin', false);
  }
  if (remoteMessage.data.type == 'log') {
    sendLog();
  }
});

if (isIOS) {
  messaging()
    .getIsHeadless()
    .then(isHeadless => {});
}

AppRegistry.registerComponent(appName, () => App);
