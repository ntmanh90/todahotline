import { AppRegistry, DeviceEventEmitter, Platform } from 'react-native';
import App from './App';
import messaging from '@react-native-firebase/messaging';
import { name as appName } from './app.json';
import BackgroundTimer from 'react-native-background-timer';
import storeData from './app/hooks/storeData';
import keyStoreData from './app/utils/keyStoreData';
import DeviceInfo from 'react-native-device-info';
import NetInfo from '@react-native-community/netinfo';
import { getHub, getHubAndReconnect } from './app/hubmanager/HubManager';
import BaseURL from './app/utils/BaseURL';
import logData from './app/utils/logData';
import AppApi from './app/api/Client';
var conn = getHubAndReconnect();
BackgroundTimer.start();

conn.off('IncomingCallAsterisk');
conn.on('IncomingCallAsterisk', (callid, number, displayname, data, id) => {
    logData.writeLogData('[[on] | IncomingCallAsterisk], index: ' + number);
    let sdt_incoming = number;
    storeData.getStoreDataValue(keyStoreData.Prefix).then((prefix) => {
        sdt_incoming = number.replace(prefix, "");
        storeData.setStoreDataValue(keyStoreData.soDienThoaiDen, sdt_incoming);
    });

    var signal = JSON.parse(data);
    storeData.setStoreDataObject(keyStoreData.signalWebRTC, signal);
    storeData.setStoreDataValue(keyStoreData.callid, callid);

    DeviceEventEmitter.emit('displayIncomingCallEvent');
});

// Register background handler
messaging().setBackgroundMessageHandler(async remoteMessage => {
    conn = getHubAndReconnect();
    if (remoteMessage.data.type == "wakeup") {
        logData.writeLogData('[Wakeup]');
        let paramNotiData = {
            uniqueid: remoteMessage.data.uniqueid,
            channel: remoteMessage.data.channel,
        };
        storeData.setStoreDataObject(keyStoreData.paramNoti, paramNotiData);

        let http = await storeData.getStoreDataValue(keyStoreData.urlApi);
        var url = http + "redirect"
        console.log(url);

        NetInfo.fetch().then(async (state) => {
            let idct = await storeData.getStoreDataValue(keyStoreData.idct);
            let mact = await storeData.getStoreDataValue(keyStoreData.tenct);
            let idnhanvien = await storeData.getStoreDataValue(keyStoreData.idnhanvien);
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
            }

            AppApi.RequestPOST(url, params, (err, json) => {
                if (!err) {
                    if (json.data.status) {
                        logData.writeLogData('[CallAPI: redirect]: Result' + JSON.stringify(json.data.status))
                    } else {
                    }
                }
            });
        });
    }
});


AppRegistry.registerComponent(appName, () => App);