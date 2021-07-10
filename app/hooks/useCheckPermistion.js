import { useState } from "react";
import { Platform } from "react-native";
import { PermissionsAndroid } from "react-native";

export default useCheckPermistion = () => {
    const [callPhone, setCallPhone] = useState(false);
    const [recordAudio, setRecordAudio] = useState(false);
    const [readPhoneState, setReadPhoneState] = useState(false);
    const [checkPermissions, setCheckPermissions] = useState(true);


    const requestCallPhonePermission = async () => {
        try {
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
                setCallPhone(true);
            } else {
                setCheckPermissions(false);
                console.log("false permistion call_phone");
            }
        } catch (err) {
            console.warn(err);
        }
    };

    const requestReadPhoneStatePermission = async () => {
        try {
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
                setReadPhoneState(true);
            } else {
                setCheckPermissions(false);
                console.log("false permistion READ_PHONE_STATE");
            }
        } catch (err) {
            console.warn(err);
        }
    };

    const requestRecordAudioPermission = async () => {
        try {
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
                setRecordAudio(true);
            } else {
                setCheckPermissions(false);
                console.log("false permistion mircophone");
            }
        } catch (err) {
            console.warn(err);
        }
    };

    const requestForegroundServicePermission = async () => {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.FOREGROUND_SERVICE,
                {
                    title: "Cấp quyền hiển thị trên ứng dụng khác",
                    message:
                        "Vui lòng cấp quyền hiển trị trên ứng dụng khác.",
                    buttonNegative: "Cancel",
                    buttonPositive: "OK"
                }
            );
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                console.log("ok permistion FOREGROUND_SERVICE");
            } else {
                console.log("false permistion FOREGROUND_SERVICE");
            }
        } catch (err) {
            console.warn(err);
        }
    };

    const checkAllPermissions = async () => {
        requestCallPhonePermission();
        requestReadPhoneStatePermission();
        requestRecordAudioPermission();
    }

    return {
        requestCallPhonePermission,
        requestReadPhoneStatePermission,
        requestRecordAudioPermission,
        requestForegroundServicePermission,
        checkAllPermissions,
        checkPermissions
    }
}
