
import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View
} from 'react-native';
import PushNotificationIOS from "@react-native-community/push-notification-ios";
import PushNotification from "react-native-push-notification";
import messaging from "@react-native-firebase/messaging";
import AppNavigation from './app/navigation/AppNavigation';
import RNCallKeep from 'react-native-callkeep';
import storeData from './app/hooks/storeData';


const App = (props) => {

  const requestUserPermission = async () => {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      log('Authorization status:', authStatus);
    }
  }

  const checkHasPhoneAccount = async () => {
    if (!isIOS) {
      RNCallKeep.backToForeground();

      const options = {
        alertTitle: 'Chưa xét tài khoản mặc định',
        alertDescription: 'Vui lòng đặt tài khoản điện thoại mặc định'
      };

      RNCallKeep.hasDefaultPhoneAccount(options);
      let checkPhoneAccount = await RNCallKeep.hasPhoneAccount();
      if (!checkPhoneAccount)
        alert('Vui lòng cấp quyền truy cập vào tài khoản cuộc gọi.');
    }
  }

  useEffect(() => {

    requestUserPermission();
    checkHasPhoneAccount();

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


  }, []);

  return (
    <AppNavigation />

  );

};


export default App;
