package com.todahotline;

import android.content.Context;
import android.content.Intent;

public class GcmKeepAlive {
    protected Context mContext;
    protected Intent gTalkHeartBeatIntent;
    protected Intent mcsHeartBeatIntent;

    public GcmKeepAlive(Context context) {
        mContext = context;
        gTalkHeartBeatIntent = new Intent(
                "com.google.android.intent.action.GTALK_HEARTBEAT");
        mcsHeartBeatIntent = new Intent(
                "com.google.android.intent.action.MCS_HEARTBEAT");
    }

    public void broadcastIntents() {
        mContext.sendBroadcast(gTalkHeartBeatIntent);
        mContext.sendBroadcast(mcsHeartBeatIntent);
    }
}
