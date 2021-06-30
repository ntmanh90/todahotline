/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import messaging from '@react-native-firebase/messaging';
import { name as appName } from './app.json';
import RNCallKeep from 'react-native-callkeep';
import uuid from 'uuid';


const getNewUuid = () => uuid.v4().toLowerCase();

const format = uuid => uuid.split('-')[0];

const getRandomNumber = () => String(Math.floor(Math.random() * 100000));

const addCall = (callUUID, number) => {
    setHeldCalls({ ...heldCalls, [callUUID]: false });
    setCalls({ ...calls, [callUUID]: number });
};

const displayIncomingCall = (number) => {
    const callUUID = getNewUuid();
    //addCall(callUUID, number);

    //log(`[displayIncomingCall] ${format(callUUID)}, number: ${number}`);

    RNCallKeep.displayIncomingCall(callUUID, number, number, 'number', true);
};

const displayIncomingCallNow = () => {
    displayIncomingCall(getRandomNumber());
};

// Register background handler
messaging().setBackgroundMessageHandler(async remoteMessage => {
    displayIncomingCallNow();

    console.log('Message handled in the background!', remoteMessage);
    // if (remoteMessage.data.type == "wakeup")
    // {

    // }

});


AppRegistry.registerComponent(appName, () => App);
