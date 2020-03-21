import React, { Component } from 'react';
import { Platform, StyleSheet, Text, View, TouchableOpacity, PermissionsAndroid, Alert } from 'react-native';
import TwilioVoice from 'react-native-twilio-programmable-voice';
import RNCallKeep from 'react-native-callkeep';

const options = {
  ios: {
    appName: 'My app name',
  },
  android: {
    alertTitle: 'Permissions required',
    alertDescription: 'This application needs to access your phone accounts',
    cancelButton: 'Cancel',
    okButton: 'ok',
    imageName: 'phone_account_icon',
    additionalPermissions: [PermissionsAndroid.PERMISSIONS.example]
  }
};

export default class App extends Component {

  constructor(props){
    super(props);

    this.state = {
      twilioInited: false,
      message: '',
      currentCallId: null
    };

    RNCallKeep.addEventListener('answerCall', this.onAnswerCallAction);
    RNCallKeep.addEventListener('endCall', this.onEndCallAction);
  }

  async componentDidMount() {
    console.log('Did Mounting ....')
    this.initTwilio()

    RNCallKeep.setup(options).then(accepted => {});  
  }

  onAnswerCallAction = (data) => {
    let { callUUID } = data;
    RNCallKeep.setCurrentCallActive(callUUID);
    // RNCallKeep.endCall(callUUID);
    TwilioVoice.accept();
  };

  onEndCallAction = (data) => {
    let { callUUID } = data;
    RNCallKeep.endCall(callUUID);
    TwilioVoice.reject();
    TwilioVoice.disconnect();
    this.state.currentCallId = null;
  };

  getCurrentCallId = () => {
    
    return this.state.currentCallId;
  };

  getAuthToken = () => {
    return fetch('http://172.106.32.136:5000/accessToken?identity=test2', { //replace c2a19b17.ngrok.io with your link (from Step 1)
      method: 'get',
    })
      .then(response => response.text())
      .catch((error) => console.error(error));
  }

  getMicrophonePermission = () => {
    const audioPermission = PermissionsAndroid.PERMISSIONS.RECORD_AUDIO;

    return PermissionsAndroid.check(audioPermission).then(async result => {
      if (!result) {
        const granted = await PermissionsAndroid.request(audioPermission, {
          title: 'Microphone Permission',
          message: 'App needs access to you microphone ' + 'so you can talk with other users.',
        });
      }
    });
  }

  initTwilio = async () => {
    const token = await this.getAuthToken();

    if (Platform.OS === 'android') {
      await this.getMicrophonePermission();
    }

    await TwilioVoice.initWithToken(token);

    TwilioVoice.addEventListener('deviceReady', () => {
      this.setState({ twilioInited: true });
    });

    TwilioVoice.addEventListener('deviceNotReady', function(data) {
      this.setState({ twilioInited: false });
    })

    TwilioVoice.addEventListener('connectionDidConnect', function(data) {
      console.log('Did Connected')
    })
    TwilioVoice.addEventListener('connectionDidDisconnect', function(data: mixed) {
      console.log('Did DisConnected')
    })
        
    // Android Only
    TwilioVoice.addEventListener('deviceDidReceiveIncoming', function(data) {
      console.log('Receiving Incoming ....')
    })

    if (Platform.OS === 'ios') { //required for ios
      TwilioVoice.configureCallKit({
        appName: 'ReactNativeTwilioExampleApp',
      });
    }

    const active = await TwilioVoice.getActiveCall();
    if ( active != undefined ) {
      const { call_state, call_sid } = active
      if ( call_state == 'PENDING' ) {
        
        RNCallKeep.displayIncomingCall(call_sid, 'test1', 'test1', 'number');
      }
      this.setState({ message: call_state, currentCallId: call_sid})
    }
  };

  makeCall = () => TwilioVoice.connect({ To: 'test1' });

  cancelCall = () => TwilioVoice.reject();


  render() {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={() => this.initTwilio()}>
          <View>
            <Text>Caller {this.state.message}</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={{marginTop: 20}} disabled={!this.state.twilioInited} onPress={() => this.makeCall()}>
          <View>
            <Text>Make call ({this.state.twilioInited ? 'ready' : 'not ready'})</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={{marginTop: 20}} disabled={!this.state.twilioInited} onPress={() => this.cancelCall()}>
          <View>
            <Text>Cancel call ({this.state.twilioInited ? 'ready' : 'not ready'})</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
});
