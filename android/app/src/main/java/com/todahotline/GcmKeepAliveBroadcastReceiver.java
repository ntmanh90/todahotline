package com.todahotline;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;
import android.widget.Toast;

public class GcmKeepAliveBroadcastReceiver extends BroadcastReceiver {

    private GcmKeepAlive gcmKeepAlive;

    @Override
    public void onReceive(Context context, Intent intent) {
        gcmKeepAlive = new GcmKeepAlive(context);
        gcmKeepAlive.broadcastIntents();
    }

}
