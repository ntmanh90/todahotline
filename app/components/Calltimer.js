import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';

export default function Calltimer({ TimeDuration }) {
    const [timer, setTimer] = useState(null);
    const [counter, setCounter] = useState(0);


    const minute = () => {
        var min = Math.floor(counter / 60);
        return min > 9 ? min.toString() : "0" + min.toString();
    }

    const seconds = () => {
        var sec = Math.floor(counter % 60);
        return sec > 9 ? sec.toString() : "0" + sec.toString();
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
        setCounter(ts);
    }

    useEffect(() => {
        console.log('[TimeDuration]: ', TimeDuration);
        start();

        return () => {
            stop();
        }
    }, [TimeDuration]);


    return <Text style={styles.timer}>{minute() + ":" + seconds()}</Text>

}

var styles = StyleSheet.create({
    timer: {
        color: "#fff",
        alignSelf: "center",
        marginTop: 5,
        fontSize: 30
    }
});