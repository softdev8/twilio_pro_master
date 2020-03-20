package com.testpro.twilio;

import android.content.Intent;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.util.Log;
import android.view.WindowManager;

import com.facebook.react.ReactActivity;
import com.hoxfon.react.RNTwilioVoice.fcm.VoiceFirebaseMessagingService;

import io.wazo.callkeep.RNCallKeepModule;

import static com.hoxfon.react.RNTwilioVoice.TwilioVoiceModule.ACTION_INCOMING_CALL;

public class MainActivity extends ReactActivity {

    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
//        getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED|
//                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON|
//                WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);

        Intent intent = getIntent();
        String action = intent.getAction();
        if (action == ACTION_INCOMING_CALL) {
            Log.d("test -------------", "haahahahaha");

        }
    }

    @Override
    protected String getMainComponentName() {
        return "ReactNativeTwilioExampleApp";
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        switch (requestCode) {
            case RNCallKeepModule.REQUEST_READ_PHONE_STATE:
                RNCallKeepModule.onRequestPermissionsResult(requestCode, permissions, grantResults);
                break;
        }
    }
}
