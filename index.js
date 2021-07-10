import { AppRegistry, DeviceEventEmitter, Platform } from 'react-native';
import App from './App';
import messaging from '@react-native-firebase/messaging';
import { name as appName } from './app.json';
import BackgroundTimer from 'react-native-background-timer';
import storeData from './app/hooks/storeData';
import AppApi from './app/api/Client';
import keyStoreData from './app/utils/keyStoreData';
import DeviceInfo from 'react-native-device-info';
import NetInfo from '@react-native-community/netinfo';
import { getHub, getHubAndReconnect } from './app/hubmanager/HubManager';
import BaseURL from './app/utils/BaseURL';
import logData from './app/utils/logData';
import * as RootNavigation from './app/navigation/RootNavigation';
import { HubConnectionState } from '@microsoft/signalr';

var conn = getHubAndReconnect();
BackgroundTimer.start();

conn.off('IncomingCallAsterisk');
conn.on('IncomingCallAsterisk', (callid, number, displayname, data, id) => {
    logData.writeLogData('Server call client: event IncomingCallAsterisk index');
    let sdt_incoming = number;
    storeData.getStoreDataValue(keyStoreData.Prefix).then((prefix) => {
        console.log('prefix: ', prefix);
        sdt_incoming = number.replace(prefix, "");
        console.log('sdt_incoming: ', sdt_incoming);
        storeData.setStoreDataValue(keyStoreData.soDienThoai, sdt_incoming);
    });

    var signal = JSON.parse(data);
    storeData.setStoreDataObject(keyStoreData.signalWebRTC, signal);
    storeData.setStoreDataValue(keyStoreData.callid, callid);

    DeviceEventEmitter.emit('displayIncomingCallEvent');
});

// Register background handler
messaging().setBackgroundMessageHandler(async remoteMessage => {
    if (remoteMessage.data.type == "wakeup") {
        conn = getHubAndReconnect();
        logData.writeLogData('Nhận được firebase: số gọi đến ' + remoteMessage.data.songuon);

        if (conn.state === HubConnectionState.Disconnected) {
            logData.writeLogData('Đã kết nối signalR thành công');
        }

        console.log('------wake up');
        console.log('Message handled in the background!', remoteMessage);
        let soDienThoai = remoteMessage.data.songuon;
        console.log('Sodienthoai', soDienThoai);
        //let soDienThoai = getRandomNumber();
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
            console.log("params redirect: ", params)

            fetch(url, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params)
            });

        });

        // DeviceEventEmitter.emit('displayIncomingCallEvent');
    }
});


AppRegistry.registerComponent(appName, () => App);