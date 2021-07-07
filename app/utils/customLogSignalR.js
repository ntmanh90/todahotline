const serverCallClient = (event) => {
    console.log('SignalR_ server_client event: ' + event);
}

const clientCallServer = (event) => {
    console.log('SignalR_ client_server event: ' + event);
}

const clientCallServerError = (event, error) => {
    console.log('SignalR_ client_server event: ' + event + ' error: ' + error);
}

export default {
    serverCallClient, clientCallServer, clientCallServerError
}