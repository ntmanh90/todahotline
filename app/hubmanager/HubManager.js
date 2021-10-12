import {hubUrl, local_hubUrl, https_url} from './SignalConfig';
import {
  ILogger,
  LogLevel,
  HubConnectionBuilder,
  HubConnectionState,
} from '@microsoft/signalr';
import storeData from '../hooks/storeData';
import LogSignalR from '../utils/customLogSignalR';
import logData from '../utils/logData';
import NetInfo from '@react-native-community/netinfo';

let hub = new HubConnectionBuilder()
  .withUrl(https_url)
  //.withAutomaticReconnect([0, 1000, 5000, 10000, 20000])
  // .configureLogging(LogLevel.Information)
  .build();
hub.serverTimeoutInMilliseconds = 120000;

let _onConnected;

function onConnected(cb) {
  console.log('ONCONNECTED NÈ.');
  _onConnected = cb;
}

function connectServer(check) {
  try {
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        if (hub.state !== HubConnectionState.Disconnected) {
          console.log('đã vào hàm reconnect');
          if (check) {
            JoinServer();
          } else {
            reconnectServer();
          }
        } else {
          console.log('bắt đầu gọi hàm kết nối server');
          hub.start().then(() => {
            if (check) {
              JoinServer();
            } else {
              reconnectServer();
            }
          });
        }

        console.log('Internet connected');
      } else {
        setTimeout(() => connectServer(check), 2000);
      }
    });
  } catch (error) {
    console.log(error);
  }
}

function JoinServer() {
  console.log('client call Join to Server');
  try {
    storeData.getStoreDataObject('sip_user').then(sipUser => {
      if (!sipUser) return;
      // logData.writeLogData('[ReJoin server]:' + sipUser.user + ", " + sipUser.mact);
      try {
        hub.invoke('Join', sipUser.user, sipUser.mact, 2).catch();
      } catch (error) {
        console.log('Hub Error: ', error);
        LogSignalR.clientCallServerError('Join', error);
        setTimeout(() => connectServer(true), 2000);
      }
    });
  } catch (ex) {
    console.log(ex);
    setTimeout(() => connectServer(true), 2000);
  }
}

function reconnectServer() {
  console.log('client call ReJoin to Server');
  try {
    storeData.getStoreDataObject('sip_user').then(sipUser => {
      console.log('sip_user: ', sipUser);
      if (!sipUser) return;
      // logData.writeLogData('[ReJoin server]:' + sipUser.user + ", " + sipUser.mact);
      try {
        hub.invoke('ReJoin', sipUser.user, sipUser.mact, 2).catch();
      } catch (error) {
        console.log('Hub Error: ', error);
        LogSignalR.clientCallServerError('ReJoin', error);
        setTimeout(() => connectServer(), 2000);
      }
    });
  } catch (ex) {
    console.log(ex);
    setTimeout(() => connectServer(), 2000);
  }
}

hub.off('Registered');
hub.on('Registered', (number, id) => {
  console.log('Registered : ' + id);
  LogSignalR.serverCallClient('Registered');
  try {
    hub.invoke('ConfirmEvent', 'Registered', null);
  } catch (error) {
    LogSignalR.clientCallServerError('Registered', error);
  }
  if (_onConnected) {
    console.log('_onConnected : ' + id);
    _onConnected();
  }

  storeData.setStoreDataValue('Registered', true);
  storeData.setStoreDataValue('SessionCallId', id);
});

function getHub() {
  return hub;
}

function getHubAndReconnect() {
  //  logData.writeLogData('[ReJoin server]:' + JSON.stringify(hub.state));
  if (hub.state === HubConnectionState.Disconnected) {
    logData.writeLogData('[Disconnected] -> Reconnect');
    hub.start().then(() => {
      reconnectServer();
    });
  }
  if (hub.state === HubConnectionState.Connecting) {
    // logData.writeLogData('[Connecting] -> Reconnect');
    reconnectServer();
  }
  // hub.off('Registered');
  // hub.on('Registered', (number, id) => {
  //     LogSignalR.serverCallClient('Registered');
  //     try {
  //         hub.invoke("ConfirmEvent", "Registered", null);
  //     } catch (error) {
  //         LogSignalR.clientCallServerError('Registered', error)
  //     }
  //     if(_onConnected) onConnected();
  //     storeData.setStoreDataValue('Registered', true)
  //     storeData.setStoreDataValue('SessionCallId', id)
  // });

  return hub;
}

export {
  getHub,
  connectServer,
  reconnectServer,
  getHubAndReconnect,
  onConnected,
};
