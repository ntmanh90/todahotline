import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import storeData from '../../hooks/storeData';
import { HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { getHub, connectServer, reconnectServer } from '../../hubmanager/HubManager';

var conn = getHub();
if (conn.state === HubConnectionState.Disconnected) {
    conn.start();
}


conn.on('Registered', (number, id) => {
    console.log('server call Registered');
    console.log("Registered index: ", number);
    try {
        conn.invoke("ConfirmEvent", "Registered");
    } catch (error) {
        console.log('Error ConfirmEvent SignalR_Registered', error);
    }
    storeData.setStoreDataValue('Registered', JSON.stringify(true))
    storeData.setStoreDataValue('MainID', JSON.stringify(id))

});
conn.on("Reconnect", () => {
    console.log('server call Reconnect');
    try {
        conn.invoke("ConfirmEvent", "Reconnect");
    } catch (error) {
        console.log('Error ConfirmEvent SignalR_ConfirmEvent', error);
    }
    reconnectServer()
})


function BanPhim({ navigation }) {

    const ConnectServer = () => {
        console.log('call join server');
        console.log(conn);
        conn.invoke('Join',
            '637',
            'lachong'
        );
    }
    useEffect(() => {
        //connectServer();
    }, [])
    return (
        <View style={styles.container}>
            <Text onPress={ConnectServer}>Connect Server</Text>
            {/* <Text onPress={() => { navigation.navigate('DienThoai') }}>Bàn phím</Text> */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {}
});

export default BanPhim;