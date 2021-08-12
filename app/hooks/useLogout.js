
import React, { useState } from 'react';
import storeData from './storeData';
import BaseURL from '../utils/BaseURL';
import RNCallKeep from 'react-native-callkeep';
import { getHub, getHubAndReconnect } from '../hubmanager/HubManager';
import deviceInfoModule from 'react-native-device-info';
import AppApi from '../api/Client';
import keyStoreData from '../utils/keyStoreData';
import BackgroundTimer from 'react-native-background-timer';

BackgroundTimer.start();
var conn = getHubAndReconnect();

const removeDataLogin = () => {
    storeData.setStoreDataObject(keyStoreData.sip_user, {});
    storeData.setStoreDataValue(keyStoreData.tennhanvien, '');
    storeData.setStoreDataValue(keyStoreData.isLogin, false);
}
export default useLogout = () => {
    const [error, setError] = useState(true);
    const [isLogout, setIsLogout] = useState(false);

    const logOut = async () => {
        console.log('đã vào hàm này');
        let http = await storeData.getStoreDataValue('urlApi');
        var url = http + BaseURL.URL_LOGOUT;

        let tennhanvien = await storeData.getStoreDataValue('tennhanvien');
        let mact = await storeData.getStoreDataValue('tenct');
        let prefix = await storeData.getStoreDataValue('Prefix');
        let somayle = await storeData.getStoreDataValue('somayle');
        let tendangnhap = await storeData.getStoreDataValue('tendangnhap');
        let chucvu = await storeData.getStoreDataValue('chucvu');
        let idnhanvien = await storeData.getStoreDataValue('idnhanvien');
        let imei = deviceInfoModule.getUniqueId();

        var params = {
            imei: imei,
            prefix: prefix,
            mact: mact,
            somayle: somayle,
            hinhthucdangxuat: '0',
            idnhanvien: idnhanvien,
            token: '',
        };
        fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params)
        }).then((responce) => {
            if (responce.status) {
                BackgroundTimer.setTimeout(() => {
                    try {
                        removeDataLogin();
                        setError(false);
                        setIsLogout(true);
                        conn.invoke('SignOut').catch();
                        conn.stop();
                    }
                    catch (err) {
                        removeDataLogin();
                    }
                }, 5000);

                // conn.invoke('SignOut', somayle).catch();
                // conn.stop();
            }
        })
    }

    return { error, isLogout, logOut };
}
