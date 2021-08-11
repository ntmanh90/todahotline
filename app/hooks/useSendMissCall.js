import React, { useState } from 'react'
import keyStoreData from '../utils/keyStoreData';
import storeData from './storeData';
import AppApi from '../api/Client';
import BaseURL from '../utils/BaseURL';
import moment from 'moment';

export default useApi = () => {
    const [statusCallApi, setStatusCallApi] = useState(false);

    const request = async (sdt, typeMissCall) => {
        let dateNow = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
        let http = await storeData.getStoreDataValue(keyStoreData.urlApi);
        let url = http + BaseURL.URL_SEND_INFO_MISSCALL;

        let mact = await storeData.getStoreDataValue(keyStoreData.idct);
        let idnhanvien = await storeData.getStoreDataValue(keyStoreData.idnhanvien);
        let paramNoti = await storeData.getStoreDataObject(keyStoreData.paramNoti);
        console.log('[paramNoti]', paramNoti);
        let sodich = await storeData.getStoreDataValue(keyStoreData.somayle);

        var params = {
            thoigiannhancuocgoi: paramNoti.thoiGianCuocGoiDen,
            uniqueid: paramNoti.uniqueid,
            channel: paramNoti.uuid,
            songuon: sdt,
            mact,
            sodich,
            idnhanvien,
            sodichketthuc: typeMissCall,
            thoigianketthuc: dateNow,
        }

        AppApi.RequestPOST(url, params, (err, json) => {
            if (!err) {
                if (json.data.status) {
                    setStatusCallApi(true);
                    let paramNotiData = {
                        uniqueid: "",
                        channel: "",
                        thoiGianCuocGoiDen: "",
                    };

                    storeData.setStoreDataObject(keyStoreData.paramNoti, paramNotiData);
                }
            }
        });
    };

    return { statusCallApi, request };
}