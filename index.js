/**
 * @format
 */

import { AppRegistry, DeviceEventEmitter } from 'react-native';
import App from './App';
import messaging from '@react-native-firebase/messaging';
import { name as appName } from './app.json';
import RNCallKeep from 'react-native-callkeep';
import BackgroundTimer from 'react-native-background-timer';
import uuid from 'uuid';
import storeData from './app/hooks/storeData';

BackgroundTimer.start();

const getNewUuid = () => uuid.v4().toLowerCase();
const getRandomNumber = () => String(Math.floor(Math.random() * 100000));


// Register background handler
messaging().setBackgroundMessageHandler(async remoteMessage => {
    //let soDienThoai = remoteMessage.data.songuon;
    let soDienThoai = getRandomNumber();
    storeData.setStoreDataValue('soDienThoai', soDienThoai);
    BackgroundTimer.setTimeout(() => {
        DeviceEventEmitter.emit('displayIncomingCallEvent');
    }, 1000);

    console.log('Message handled in the background!', remoteMessage);
});


AppRegistry.registerComponent(appName, () => App);
