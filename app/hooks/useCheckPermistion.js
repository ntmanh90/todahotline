import { useState } from "react";
import { PermissionsAndroid } from "react-native";

export default useCheckPermistion = () => {
    const [callPhone, setCallPhone] = useState(true);
    const [recordAudio, setRecordAudio] = useState(true);
    const [readPhoneState, setReadPhoneState] = useState(true);

    const requestCallPhonePermission = async () => {
        try {
            const check_CALL_PHONE = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CALL_PHONE);
            console.log('check_CALL_PHONE: ', check_CALL_PHONE);
            if (check_CALL_PHONE === false) {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.CALL_PHONE,
                    {
                        title: "Cấp quyền gọi điện",
                        message:
                            "Vui lòng cấp quyền gọi điện thoại. ",
                        buttonNegative: "Cancel",
                        buttonPositive: "OK"
                    }
                );
                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    console.log("ok permistion CALL_PHONE");
                    setCallPhone(false);
                } else {
                    console.log("false permistion call_phone");
                }
            }

        } catch (err) {
            console.warn(err);
        }
    };

    const requestReadPhoneStatePermission = async () => {
        try {
            console.log('[request] READ_PHONE_STATE:');
            const check_READ_PHONE_STATE = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE);
            console.log('READ_PHONE_STATE: ', check_READ_PHONE_STATE);
            if (check_READ_PHONE_STATE === false) {

                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
                    {
                        title: "Cấp quyền tài khoản cuộc gọi",
                        message:
                            "Vui lòng cấp quyền tài khoản cuộc gọi.",
                        buttonNegative: "Cancel",
                        buttonPositive: "OK"
                    }
                );
                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    console.log("ok permistion READ_PHONE_STATE");
                    setReadPhoneState(false);
                } else {
                    console.log("false permistion READ_PHONE_STATE");
                }
            }
        } catch (err) {
            console.warn(err);
        }
    };

    const requestRecordAudioPermission = async () => {
        try {
            const check_RECORD_AUDIO = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
            console.log('check_RECORD_AUDIO: ', check_RECORD_AUDIO);
            if (check_RECORD_AUDIO === false) {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                    {
                        title: "Cấp quyền mircophone",
                        message:
                            "Vui lòng cấp quyền mircophone.",
                        buttonNegative: "Cancel",
                        buttonPositive: "OK"
                    }
                );
                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    console.log("ok permistion mircophone");
                    setRecordAudio(false);
                } else {
                    console.log("false permistion mircophone");
                }
            }
        } catch (err) {
            console.warn(err);
        }
    };

    return {
        requestCallPhonePermission,
        requestReadPhoneStatePermission,
        requestRecordAudioPermission,
        callPhone,
        recordAudio,
        readPhoneState,
    }
}
