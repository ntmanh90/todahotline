
import React, { useState } from 'react';
import storeData from './storeData';
import BaseURL from '../utils/BaseURL';
import RNCallKeep from 'react-native-callkeep';
import { getHub } from '../hubmanager/HubManager';
import deviceInfoModule from 'react-native-device-info';
import AppApi from '../api/Client';

const removeDataLogin = () => {
    console.log('gọi hàm removeDataLogin');
    storeData.setStoreDataObject('sip_user', JSON.stringify(null));
    storeData.setStoreDataValue('tennhanvien', null);
    storeData.setStoreDataValue('isLogin', JSON.stringify(false));
}
export default useLogout = () => {
    const [error, setError] = useState(true);

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

        AppApi.RequestPOST(url, params, '', (err, json) => {
            console.log('Error logout: ');

            if (!err) {
                if (json.data.status) {
                    setError(false);
                    removeDataLogin();
                    // RNCallKeep.endAllCalls();
                    // conn.invoke('SignOut', somayle).catch();
                    // conn.stop();
                }
            }
        });
    }

    return { error, logOut };
}
