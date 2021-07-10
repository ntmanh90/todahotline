import storeData from "../hooks/storeData";

const writeLogData = (desLog) => {
    storeData.getStoreDataObject('dataLog').then((dataLog) => {
        var arrayLog = [];
        if (dataLog !== null) {
            arrayLog = dataLog;
        }
        var datel = new Date();
        var ngayl = datel.getDate().toString() + '/' + (datel.getMonth() + 1).toString() + '/' + datel.getFullYear().toString();
        var giol = datel.getHours().toString() + ':' + datel.getMinutes().toString() + ':' + datel.getSeconds().toString();
        arrayLog.push({
            logType: desLog,
            logTime: ngayl + " " + giol,
            index: 0,
        });
        //console.log('arrayLog', arrayLog);

        storeData.setStoreDataObject('dataLog', arrayLog);
    });
}

const readLogData = () => {
    storeData.getStoreDataObject('dataLog').then((dataLog) => {
        var arrayLog = [];
        if (dataLog === null) {
            arrayLog = [];
        }
        return arrayLog;
    });
}

export default {
    writeLogData,
    readLogData
}