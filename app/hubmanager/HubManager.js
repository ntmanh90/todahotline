import { hubUrl, local_hubUrl, https_url } from './SignalConfig';
import { ILogger, LogLevel, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import storeData from '../hooks/storeData';


let hub = new HubConnectionBuilder().withUrl(https_url, {
    accessTokenFactory: () => {
        storeData.getStoreDataValue('TokenSip').then((TokenSip) => {
            return TokenSip
        })
    }
}).build();


function connectServer() {
    try {
        hub
            .start()
            .then(() => {
                console.log('start sip');
                try {
                    hub.invoke('Join',
                        '637',
                        'lachong'
                    ).catch();
                } catch (error) {
                    console.log('Hub Error: ', error);
                }

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

    try {
        var sipUser = JSON.parse(json);
        console.log('sip_user: ', sipUser);
        try {
            hub.invoke('Join',
                '637',
                'lachong'
            ).catch();
        } catch (error) {
            console.log('Hub Error: ', error);
        }


    } catch (ex) {
        console.log(ex);
    }
}

function getHub() {
    return hub
}

export { getHub, connectServer, reconnectServer }
