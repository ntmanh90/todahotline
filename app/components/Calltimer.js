import React, { useState, useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';

export default function Calltimer({ TimeDuration }) {
    const [timer, setTimer] = useState(null);
    const [minute, setMinute] = useState('00');
    const [seconds, setSeconds] = useState('00');


    const handleMinute = (_counter) => {
        var min = Math.floor(_counter / 60);
        setMinute(min > 9 ? min.toString() : "0" + min.toString());
    }

    const handlSeconds = (_counter) => {
        var sec = Math.floor(_counter % 60);
        setSeconds(sec > 9 ? sec.toString() : "0" + sec.toString());
    }

    const start = () => {
        let _timer = setInterval(tick, 1000);
        setTimer(_timer);
    }

    const stop = () => {
        clearInterval(timer);
    }

    const tick = () => {
        const t2 = TimeDuration;
        const t1 = new Date().getTime();
        let ts = (t1 - t2.getTime()) / 1000;
        handleMinute(ts);
        handlSeconds(ts);
    }

    useEffect(() => {
        start();

        return () => {
            stop();
        }
    }, [TimeDuration]);

    return <Text style={styles.timer}>{minute + ":" + seconds}</Text>
}

var styles = StyleSheet.create({
    timer: {
        color: "#fff",
        alignSelf: "center",
        marginTop: 5,
        fontSize: 30
    }
});