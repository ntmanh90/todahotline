package com.todahotline;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.SystemClock;

public class BootReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent.getAction().equals("android.intent.action.BOOT_COMPLETED")) {
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            Intent _intent = new Intent(context, GcmKeepAliveBroadcastReceiver.class);
            PendingIntent gcmKeepAlivePendingIntent = PendingIntent.getBroadcast(context, 0, _intent, PendingIntent.FLAG_CANCEL_CURRENT);
            alarmManager.setInexactRepeating(AlarmManager.ELAPSED_REALTIME, SystemClock.elapsedRealtime(), 4 * 60 * 1000, gcmKeepAlivePendingIntent );
        }
    }
}
