package com.todahotline;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.os.SystemClock;
import android.view.WindowManager;
import android.widget.Toast;

import com.facebook.react.ReactActivity;
// Add these import lines
import io.wazo.callkeep.RNCallKeepModule;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import java.util.List;

public class MainActivity extends ReactActivity {

    AlarmManager alarmManager;
    PendingIntent gcmKeepAlivePendingIntent;

    /**
     * Returns the name of the main component registered from JavaScript. This is
     * used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "todahotline";
    }

    // Permission results
    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions,
            @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        switch (requestCode) {
            case RNCallKeepModule.REQUEST_READ_PHONE_STATE:
                RNCallKeepModule.onRequestPermissionsResult(requestCode, permissions, grantResults);
                break;
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        alarmManager = (AlarmManager)getSystemService(Context.ALARM_SERVICE);
        Intent intent = new Intent(this, GcmKeepAliveBroadcastReceiver.class);
        gcmKeepAlivePendingIntent = PendingIntent.getBroadcast(this, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT);
        alarmManager.setInexactRepeating(AlarmManager.ELAPSED_REALTIME, 1000, 2 * 60 * 1000, gcmKeepAlivePendingIntent  );
        this.getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED);
        this.getWindow().addFlags(WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);
        this.getWindow().addFlags(WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD);
        this.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

}
