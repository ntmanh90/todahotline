package vn.lachong.todaphone;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class GcmKeepAliveBroadcastReceiver extends BroadcastReceiver {

    private GcmKeepAlive gcmKeepAlive;

    @Override
    public void onReceive(Context context, Intent intent) {
        gcmKeepAlive = new GcmKeepAlive(context);
        gcmKeepAlive.broadcastIntents();
    }

}
