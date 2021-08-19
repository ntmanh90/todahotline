import { hubUrl, local_hubUrl, https_url } from './SignalConfig';
import { ILogger, LogLevel, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import storeData from '../hooks/storeData';
import LogSignalR from '../utils/customLogSignalR';
import logData from '../utils/logData';


let hub = new HubConnectionBuilder()
    .withUrl(https_url)
    //.withAutomaticReconnect([0, 1000, 5000, 10000, 20000])
    // .configureLogging(LogLevel.Information)
    .build();

var cb = new Map();
var session_id = "";
const eventCalling = "Calling";
const eventSignal = "receiveSignal";
const eventRinging = "ringing";
const eventAccepted = "callAccepted";
const eventDeclined = "callDeclined";
const eventEnded = "callEnded";

hub.off('Calling');
hub.on("Calling", (callid, msg, id) => {
        if(cb.size > 0 && cb.get(id) && cb.get(id).get(eventCalling)){
            let onCalling = cb.get(id).get(eventCalling);
            onCalling(callid, msg, id); 
        }
    })

hub.off('receiveSignal');
hub.on('receiveSignal', (signal, id) => {
        if(cb.size > 0 && cb.get(id) && cb.get(id).get(eventSignal)){
            let onReceiveSignal = cb.get(id).get(eventSignal);
            onReceiveSignal(signal, id); 
        }
    });

hub.off('ringing');
hub.on('ringing', (id) => {
        if(cb.size > 0 && cb.get(id) && cb.get(id).get(eventRinging)){
            let onRinging = cb.get(id).get(eventRinging);
            onRinging(id); 
        }
    });

hub.off('callAccepted');
hub.on('callAccepted', (id) => {
        if(cb.size > 0 && cb.get(id) && cb.get(id).get(eventAccepted)){
            let onAccepted = cb.get(id).get(eventAccepted);
            onAccepted(id); 
        }
    });

hub.off('callDeclined');
hub.on('callDeclined', (callid, code, reason, id) => {
        if(cb.size > 0 && cb.get(id) && cb.get(id).get(eventDeclined)){
            let onDeclined = cb.get(id).get(eventDeclined);
            onDeclined(callid, code, reason, id); 
        }
    });

hub.off('callEnded');
hub.on('callEnded', (callid, code, reason, id) => {
        console.log(" /// Exite Call Ended Call Back ///");
        if(cb.size > 0 && cb.get(id) && cb.get(id).get(eventEnded)){
            console.log(" ~~~ Exite Call Ended Call Back ~~~")
            let onEnded = cb.get(id).get(eventEnded);
            onEnded(callid, code, reason, id);
        }
    });

function AddEvent(id, loai, callback)
{
    console.log(id == session_id ? "Event Call" : "Event Sub Call: " + id);
    if(!cb.get(id))
        cb.set(id, new Map());

    cb.get(id).set(loai, callback);
}

function getSessionID()
{
    return session_id;
}

function RemoveEvent(id)
{
    if(cb.get(id))
        cb.delete(id);
}

function connectServer() {

    try {
        storeData.getStoreDataObject('sip_user').then((sipUser) => {
            console.log('start sip', sipUser);
            try {
                if (hub.state !== HubConnectionState.Disconnected) {
                    console.log('đã vào hàm reconnect');
                    reconnectServer();
                }
                else {
                    console.log('bắt đầu gọi hềm kết nối server');
                    logData.writeLogData('[Join server]:' + sipUser.user + ", " + sipUser.mact);
                    hub.start().then(() => {
                        hub.invoke('Join',
                            sipUser.user,
                            sipUser.mact,
                            2
                        ).catch();
                    });
                }

                hub.off('Registered');
                hub.on('Registered', (number, id) => {
                    LogSignalR.serverCallClient('Registered');
                    try {
                        hub.invoke("ConfirmEvent", "Registered", null);
                    } catch (error) {
                        LogSignalR.clientCallServerError('Registered', error)
                    }
                    storeData.setStoreDataValue('Registered', true)
                    storeData.setStoreDataValue('SessionCallId', id)
                });

                // conn.off('ReceivedSubCallId')
                // conn.on('ReceivedSubCallId', (subcall_sessionid) => {
                //     conn.invoke("ConfirmEvent", "ReceivedSubCallId", null).catch((error) => console.log(error));
                //     conn.
                //     subSessionCall = subcall_sessionid;
                //     onStartCall(phonenumber, callName);
                // });

            } catch (error) {
                console.log('Hub Error: ', error);
                LogSignalR.clientCallServerError('Join', error);
            }
        });
    } catch (ex) {
        console.log(ex);
    }
}

function reconnectServer() {

    console.log('client call ReJoin to Server');
    try {
        storeData.getStoreDataObject('sip_user').then((sipUser) => {
            console.log('sip_user: ', sipUser);
            logData.writeLogData('[ReJoin server]:' + sipUser.user + ", " + sipUser.mact);
            try {
                hub.invoke('ReJoin',
                    sipUser.user,
                    sipUser.mact,
                    2
                ).catch();
            } catch (error) {
                console.log('Hub Error: ', error);
                LogSignalR.clientCallServerError('Join', error);
            }
        });

    } catch (ex) {
        console.log(ex);
    }
}

function getHub() {
    hub.serverTimeoutInMilliseconds = 120000;
    return hub;
}

function getHubAndReconnect(callback) {
    logData.writeLogData('[ReJoin server]:' + JSON.stringify(hub.state));
    if (hub.state === HubConnectionState.Disconnected) {
        logData.writeLogData('[Disconnected] -> Reconnect');
        hub.start().then(() => {
            reconnectServer();
        });
    }
    if (hub.state === HubConnectionState.Connecting) {
        logData.writeLogData('[Connecting] -> Reconnect');
        reconnectServer();
    }

    hub.off('Registered');
    hub.on('Registered', (number, id) => {
        LogSignalR.serverCallClient('Registered');
        session_id = id;

        try {
            hub.invoke("ConfirmEvent", "Registered", null);
        } catch (error) {
            LogSignalR.clientCallServerError('Registered', error)
        }
        storeData.setStoreDataValue('Registered', true)
        storeData.setStoreDataValue('SessionCallId', id)
    });

    hub.serverTimeoutInMilliseconds = 120000;
    return hub;
}

export { getHub, connectServer, reconnectServer, getHubAndReconnect, AddEvent, RemoveEvent, getSessionID,
     eventCalling, eventRinging, eventSignal, eventAccepted, eventDeclined, eventEnded }
