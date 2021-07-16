import storeData from "../hooks/storeData";
import LogDB from '../database/LogDB';

const writeLogData = (desLog) => {
    LogDB.addLog(desLog);
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