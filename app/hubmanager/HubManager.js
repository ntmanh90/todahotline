import { hubUrl, local_hubUrl, https_url } from './SignalConfig';
import { ILogger, LogLevel, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import storeData from '../hooks/storeData';
import LogSignalR from '../utils/customLogSignalR';
import logData from '../utils/logData';


let hub = new HubConnectionBuilder()
    .withUrl(https_url)
    .withAutomaticReconnect([0, 1000, 5000, 10000, 20000])
    .configureLogging(LogLevel.Information)
    .build();

function connectServer() {

    try {
        storeData.getStoreDataObject('sip_user').then((sipUser) => {
            console.log('start sip', sipUser);
            try {
                if (hub.state === HubConnectionState.Disconnected) {
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
                        hub.invoke("ConfirmEvent", "Registered");
                    } catch (error) {
                        LogSignalR.clientCallServerError('Registered', error)
                    }
                    storeData.setStoreDataValue('Registered', true)
                    storeData.setStoreDataValue('SessionCallId', id)
                });

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

function getHubAndReconnect() {
    console.log('hub.state: ', hub.state);
    if (hub.state === HubConnectionState.Disconnected) {
        console.log('hub is disconnnect');
        hub.start().then(() => {
            reconnectServer();
        });

        hub.off('Registered');
        hub.on('Registered', (number, id) => {
            LogSignalR.serverCallClient('Registered');
            try {
                hub.invoke("ConfirmEvent", "Registered");
            } catch (error) {
                LogSignalR.clientCallServerError('Registered', error)
            }
            storeData.setStoreDataValue('Registered', true)
            storeData.setStoreDataValue('SessionCallId', id)
        });
    }
    hub.serverTimeoutInMilliseconds = 120000;
    return hub;
}

export { getHub, connectServer, reconnectServer, getHubAndReconnect }
