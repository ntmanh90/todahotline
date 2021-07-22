import React, { useState } from 'react'
import keyStoreData from '../utils/keyStoreData';
import storeData from './storeData';
import AppApi from '../../api/Client';
import BaseURL from '../utils/BaseURL';
import CuocGoiDB from '../database/CuocGoiDB';

export default useApi = () => {
    const [statusCall, setStatusCall] = useState(false);

    const request = async (sdt) => {
        let http = await storeData.getStoreDataValue(keyStoreData.urlApi);
        let url = http + BaseURL.URL_CHECK_INCOMINGCAL;

        let mact = await storeData.getStoreDataValue(keyStoreData.idct);
        let sodich = await storeData.getStoreDataValue(keyStoreData.somayle);
        let paramNoti = await storeData.getStoreDataValue(keyStoreData.paramNoti);
        let songuon = sdt;
        let somayle = sodich;
        let uniqueid = paramNoti.uniqueid;
        let channel = paramNoti.channel;

        var params = {
            mact,
            sodich,
            songuon,
            somayle,
            uniqueid,
            channel,
        }

        AppApi.RequestPOST(url, params, (err, json) => {
            if (!err) {
                if (json.data.status) {
                    setStatusCall(true);

                } else {
                    CuocGoiDB.addCuocGoi(sdt, CallTypeEnum.MissingCall);
                }
            }
            else {
                CuocGoiDB.addCuocGoi(sdt, CallTypeEnum.MissingCall);
            }
        });
    };

    return { statusCall, request };
}