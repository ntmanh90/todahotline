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

callbackIceCandidateJanus = (evt, conn, callid) => {
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

callbackIceCandidateJanusState = (evt) => {
    if (evt) {
        //Found a new candidate
        console.log(evt);
    }
};
callbackIceCandidateJanusError = (err) => {
    if (err) {
        console.log(err);
    }
};

const outgoingCall = (conn, number, sessionId) => {
    mediaDevices.getUserMedia(webrtcConstraints)
        .then((stream) => {
            var connection = new RTCPeerConnection(configuration);
            connection.onicecandidate = (evt) => callbackIceCandidateJanus(evt, conn, sessionId); // ICE Candidate Callback
            connection.onicecandidateerror = (error) => callbackIceCandidateJanusError(error);
            connection.oniceconnectionstatechange = (evt) => callbackIceCandidateJanusState(evt);
            connection.addStream(stream);
            connection.createOffer().then((offer) => {
                connection.setLocalDescription(offer)
                    .then(() => {
                        console.log(offer);
                        try {
                            conn.invoke('CallAsterisk', number, connection.localDescription.sdp, sessionId);
                        } catch (error) {
                            console.log('CallAsterisk Error call out', error);
                        }
                    })
                    .catch();
            }).catch();

            // initiateSDP(route.params.phoneNumber, stream);
        })
        .catch(function (error) {
            console.log('Stream error: ' + error);
        });
}

const incomingcall = (conn, sdp, callid, callback) => {
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
                        } catch (error) {
                            console.log('AnswerCallAsterisk Error call out', error);
                        }
                        callback(connection, 2, stream)

                    });
                });
            });
        })
        .catch(function (error) {
            console.log('Stream error: ' + error.message);
        });
}

const updatecall = (conn, sdp, callid, session_id, callback) => {
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
                    conn.invoke('UpdateOffer', connection.localDescription.sdp, session_id).catch();
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

