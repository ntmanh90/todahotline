import { hubUrl, local_hubUrl, https_url } from './SignalConfig';
import { ILogger, LogLevel, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import storeData from '../hooks/storeData';
import LogSignalR from '../utils/customLogSignalR';


let hub = new HubConnectionBuilder()
    .withUrl(https_url)
    //.configureLogging(LogLevel.Information)
    .build();

function connectServer() {
    console.log('client call Join to Server');
    try {
        storeData.getStoreDataObject('sip_user').then((sipUser) => {
            console.log('start sip', sipUser);
            try {
                hub.invoke('Join',
                    sipUser.user,
                    sipUser.mact
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

function reconnectServer() {
    console.log('client call ReJoin to Server');
    try {
        storeData.getStoreDataObject('sip_user').then((sipUser) => {
            console.log('sip_user: ', sipUser);
            try {
                hub.invoke('ReJoin',
                    sipUser.user,
                    sipUser.mact
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
    // hub.serverTimeoutInMilliseconds = 120000;
    return hub;
}

function getHubAndReconnect() {
    if (hub.state === HubConnectionState.Disconnected) {
        hub.start().then(() => {
            reconnectServer();
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
        });
    }
    return hub
}

export { getHub, connectServer, reconnectServer, getHubAndReconnect }
