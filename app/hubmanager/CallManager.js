import { HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { hubUrl, local_hubUrl, https_url } from './SignalConfig';
import { RTCPeerConnection, mediaDevices, RTCSessionDescription, } from 'react-native-webrtc';

const configuration = {
    iceServers: [
        { url: 'stun:stun.voipbuster.com' },
        { url: 'stun:42.112.31.62:3478' },
        {
            url: 'turn:42.112.31.62:3478',
            username: 'lachong',
            credential: 'axy@789',
        },
    ],
};

var Januscandidates = new Array();

const webrtcConstraints = { audio: true, video: false };

const callbackIceCandidateJanus = (evt, conn, callid) => {
    conn = getHubAndReconnect();
    if (evt.candidate) {
        //Found a new candidate
        Januscandidates.push(JSON.stringify({ candidate: evt.candidate }));
    } else {
        try {
            conn.invoke('SendCandidate', Januscandidates, callid);

        } catch (error) {
            console.log('Call server Error callbackIceCandidateJanus Error: ', error);
        }
        console.log(Januscandidates);
        Januscandidates = new Array();
    }
};

const callbackIceCandidateJanusState = (evt) => {
    if (evt) {
        //Found a new candidate
        console.log(evt);
    }
};
const callbackIceCandidateJanusError = (err) => {
    if (err) {
        console.log(err);
    }
};

const outgoingCall = async (conn, number, sessionCallId, callback) => {
    conn = getHubAndReconnect();
    console.log('param', conn, number, sessionCallId);
    let stream = await mediaDevices.getUserMedia(webrtcConstraints);
    var connection = new RTCPeerConnection(configuration);

    connection.onicecandidate = (evt) => callbackIceCandidateJanus(evt, conn, sessionCallId); // ICE Candidate Callback
    connection.onicecandidateerror = (error) => callbackIceCandidateJanusError(error);
    connection.oniceconnectionstatechange = (evt) => callbackIceCandidateJanusState(evt);
    connection.addStream(stream);
    let offer = await connection.createOffer();
    connection.setLocalDescription(offer)
        .then(() => {
            try {
                conn.invoke('CallAsterisk', number, connection.localDescription.sdp, sessionCallId);
                callback(connection, stream);
            } catch (error) {
                console.log('CallAsterisk Error call out', error);
            }
        })
        .catch(error)
    {
        console.log('CallAsterisk Error setLocalDescription', error);
    }
}

const incomingcall = (conn, sdp, callid, callback) => {
    conn = getHubAndReconnect();
    mediaDevices.getUserMedia(webrtcConstraints)
        .then((stream) => {
            stream = stream
            var connection = new RTCPeerConnection(configuration);
            connection.onicecandidate = (evt) =>
                callbackIceCandidateJanus(evt, conn, callid); // ICE Candidate Callback
            connection.onicecandidateerror = (error) =>
                callbackIceCandidateJanusError(error);
            connection.addStream(stream);
            connection.setRemoteDescription(sdp).then(() => {
                connection.createAnswer().then((jsep) => {
                    connection.setLocalDescription(jsep).then(() => {
                        try {
                            conn.invoke('AnswerCallAsterisk', true, connection.localDescription.sdp, callid).catch();
                            callback(connection, stream);
                        } catch (error) {
                            console.log('AnswerCallAsterisk Error call out', error);
                        }
                    });
                });
            });

        })
        .catch(function (error) {
            console.log('Stream error: ' + error.message);
        });
}

const updatecall = (conn, sdp, callid, sessionId, callback) => {
    conn = getHubAndReconnect();
    console.log("updatecall sdp1: ", sdp)
    mediaDevices.getUserMedia(webrtcConstraints)
        .then((stream) => {
            stream = stream
            var connection = new RTCPeerConnection(configuration);
            connection.onicecandidate = (evt) =>
                callbackIceCandidateJanus(evt, conn, callid); // ICE Candidate Callback
            connection.onicecandidateerror = (error) =>
                callbackIceCandidateJanusError(error);
            connection.addStream(stream);
            connection.setRemoteDescription(sdp).then(() => {

            });
            connection.createOffer().then((offer) => {
                connection.setLocalDescription(offer).then(() => {

                    console.log("updatecall sdp2: ", connection.localDescription.sdp)
                    conn.invoke('UpdateOffer', connection.localDescription.sdp, sessionId).catch();
                    callback(connection, 2, stream)

                });
            }).catch(function (error) {
                console.log('Stream error: ' + error.message);
            });

        })
        .catch(function (error) {
            console.log('Stream error: ' + error.message);
        });
}

export default {
    outgoingCall, incomingcall, updatecall
}

