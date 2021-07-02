import { hubUrl, local_hubUrl, https_url } from './SignalConfig';
import { ILogger, LogLevel, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import storeData from '../hooks/storeData';


let hub = new HubConnectionBuilder()
    .withUrl(https_url)
    .configureLogging(LogLevel.Information)
    .build();

function connectServer() {
    console.log('client call Join to Server');
    try {
        hub
            .start()
            .then(() => {
                storeData.getStoreDataObject('sip_user').then((sipUser) => {
                    console.log('start sip', sipUser);
                    try {
                        hub.invoke('Join',
                            sipUser.user,
                            sipUser.mact
                        ).catch();
                    } catch (error) {
                        console.log('Hub Error: ', error);
                    }
                });

            })
            .catch((err) => {
                console.log(err);
                //setTimeout(this.connectServer(),5000);
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
            }
        });

    } catch (ex) {
        console.log(ex);
    }
}

function getHub() {
    if (hub.state === HubConnectionState.Disconnected) {
        hub.start().then(() => {
            connectServer();
            hub.off('Registered');
            hub.on('Registered', (number, id) => {
                console.log('server call Registered: (number, id)', number, id);
                try {
                    conn.invoke("ConfirmEvent", "Registered");
                } catch (error) {
                    console.log('Error ConfirmEvent SignalR_Registered', error);
                }
                storeData.setStoreDataValue('Registered', JSON.stringify(true))
                storeData.setStoreDataValue('MainID', JSON.stringify(id))
            });

        });

    }
    else {
        reconnectServer();

        hub.off('Registered');
        hub.on('Registered', (number, id) => {
            console.log('server call Registered: (number, id)', number, id);
            try {
                conn.invoke("ConfirmEvent", "Registered");
            } catch (error) {
                console.log('Error ConfirmEvent SignalR_Registered', error);
            }
            storeData.setStoreDataValue('Registered', JSON.stringify(true))
            storeData.setStoreDataValue('MainID', JSON.stringify(id))
        });

    }
    return hub
}

export { getHub, connectServer, reconnectServer }
