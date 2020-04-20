import React, { Component } from 'react';
import { Platform, StyleSheet, Text, View, TouchableOpacity, PermissionsAndroid, ImageBackground, Image, Dimensions } from 'react-native';
import TwilioVoice from 'react-native-twilio-programmable-voice';
import RNCallKeep from 'react-native-callkeep';
import {
  TwilioVideoLocalView,
  TwilioVideoParticipantView,
  TwilioVideo
} from 'react-native-twilio-video-webrtc'
import Colors from './Colors'

const {width, height} = Dimensions.get('window')

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

  state = {
    twilioInited: false,
    message: '',
    currentCallId: null,
    bActive: false,
    bVideoMode: false,
    isAudioEnabled: true,
    isVideoEnabled: true,
    status: 'disconnected',
    participants: new Map(),
    videoTracks: new Map(),
    remoteVideo: null,
  };

  constructor(props){
    super(props);

    // RNCallKeep.addEventListener('answerCall', this.onAnswerCallAction);
    // RNCallKeep.addEventListener('endCall', this.onEndCallAction);
    this.initTwilio = this.initTwilio.bind(this)
    this.connectTwilioVideo = this.connectTwilioVideo.bind(this)
    this.onAccept = this.onAccept.bind(this)
    this.onDecline = this.onDecline.bind(this)
  }

  componentDidMount() {
    console.log('Did Mounting ....')
    this.initTwilio()

    // RNCallKeep.setup(options).then(accepted => {});  
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

  onAccept = () => {
    this.setState({bActive: false, bVideoMode: true})
    TwilioVoice.accept();
    this.connectTwilioVideo();
  }

  onDecline = () => {
    this.setState({bActive: false})
    TwilioVoice.reject();
    TwilioVoice.disconnect();
  }

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

  getVideoToken = () => {
    return fetch('https://ur6u67j31k.execute-api.us-east-1.amazonaws.com/alpha/roomToken?username=TestUser&roomname=testroom', { //replace c2a19b17.ngrok.io with your link (from Step 1)
      method: 'get',
    })
      .then(res => res.json())
      .then(json => json.token)
      .catch((error) => console.error(error));
  }

  connectTwilioVideo = async() => {
    const token = await this.getVideoToken();

    this.refs.twilioVideo.connect({ roomName: 'testroom', accessToken: token })
  }

  _onEndButtonPress = () => {
    this.refs.twilioVideo.disconnect()
    this.setState({bVideoMode: false})
  }

  _onMuteButtonPress = () => {
    this.refs.twilioVideo.setLocalAudioEnabled(!this.state.isAudioEnabled)
      .then(isEnabled => this.setState({ isAudioEnabled: isEnabled }))
  }

  _onFlipButtonPress = () => {
    this.refs.twilioVideo.flipCamera()
  }

  _onRoomDidConnect = () => {
    this.setState({ status: 'connected' })
  }

  _onRoomDidDisconnect = ({ roomName, error }) => {
    console.tron.log('==== ROOM DISCONECT ====')
    console.tron.error(error)

    this.setState({ status: 'disconnected' }, () => {
      this.props.navigation.goBack()
    })
  }

  _onRoomDidFailToConnect = (error) => {
    console.tron.log("==== ROOM ERROR ====")
    console.tron.error(error)

    this.setState({ status: 'disconnected' })
  }

  _onParticipantAddedVideoTrack = ({ participant, track }) => {
    console.tron.log('==== ADD PARTICIPANT VIDEO ====')
    console.tron.log(participant)
    console.tron.log(track)

    this.setState({
      remoteVideo: {
        participantSid: participant.sid,
        videoTrackSid: track.trackSid
      }
    });
  }

  _onParticipantRemovedVideoTrack = ({ participant, track }) => {
    console.tron.log('==== REMOTE PARTICIPANT VIDEO ====')
    console.tron.log(participant)
    console.tron.log(track)

    this.setState({ remoteVideo: null });
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
      this.setState({ message: 'DEVICE READY', twilioInited: true });
    })

    TwilioVoice.addEventListener('deviceNotReady', function(data) {
      this.setState({ message: 'DEVICE Not READY', twilioInited: false });
    })

    TwilioVoice.addEventListener('connectionDidConnect', function(data) {
      this.setState({ message: `Did Connect ${JSON.stringify(data)}`});
    })
    TwilioVoice.addEventListener('connectionDidDisconnect', function(data: mixed) {
      console.log('Did DisConnected')
    })
        
    // Android Only
    TwilioVoice.addEventListener('deviceDidReceiveIncoming', function(data) {
      console.log('Receiving Incoming ....')
      this.setState({ message: `Did Receive Incoming ${JSON.stringify(data)}`});
    })

    if (Platform.OS === 'ios') { //required for ios
      TwilioVoice.configureCallKit({
        appName: 'TwilioTestPro',
      });
    }

    const active = await TwilioVoice.getActiveCall();
    if ( active != undefined ) {
      const { call_state, call_sid } = active
      if ( call_state == 'PENDING' ) {
        this.setState({bActive: true})
        // RNCallKeep.displayIncomingCall(call_sid, 'test1', 'test1', 'number');
      }
      this.setState({ message: call_state, currentCallId: call_sid})
    }
  };

  makeCall = () => TwilioVoice.connect({ To: 'test1' });

  cancelCall = () => TwilioVoice.reject();


  render() {
    const { bActive, bVideoMode, status, remoteVideo, isAudioEnabled } = this.state
    if ( bActive == true ) {
      return (
        <ImageBackground style={styles.maincontainer} source={require("./images/incomingbg.png")}>
          <View style={{ height: '30%' }}>
            <Text style={styles.textTop}>
              Test1
            </Text>
          </View>
          <View style={styles.viewTime}>
            <Text style={styles.textTop}>
              9 : 10 AM
            </Text>
          </View>
          <View style={styles.viewButton}>
            <TouchableOpacity style={styles.viewDecline} onPress={() => this.onDecline()}>
              <Image
                style={{width:60, height:60}}
                source={require("./images/decline.png")}
              />
              <Text style={styles.textButtons}>
                Decline
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.viewAnswer} onPress={() => this.onAccept()}>
              <Image
                style={{width:60, height:60}}
                source={require("./images/accept.png")}
              />
              <Text style={styles.textButtons}>
                Accept
              </Text>
            </TouchableOpacity>
            
            
          </View>
        </ImageBackground>
      )
    }
    if ( bVideoMode == true ) {
      return (
        <View style={styles.container}>
          <TwilioVideo
            ref="twilioVideo"
            onRoomDidConnect={this._onRoomDidConnect}
            onRoomDidDisconnect={this._onRoomDidDisconnect}
            onRoomDidFailToConnect={this._onRoomDidFailToConnect}
            onParticipantAddedVideoTrack={this._onParticipantAddedVideoTrack}
            onParticipantRemovedVideoTrack={this._onParticipantRemovedVideoTrack}
          />
          <View style={styles.callContainer}>
            {
              status === 'connected' &&
              <View style={styles.remoteGrid}>
                {
                  remoteVideo !== null && (
                    <TwilioVideoParticipantView
                      style={styles.remoteVideo}
                      key={remoteVideo.participantSid}
                      trackIdentifier={remoteVideo}
                    />
                  )
                }
              </View>
            }
            <View
              style={styles.optionsContainer}>
              <TouchableOpacity
                style={[styles.optionButton, { backgroundColor: Colors.error }]}
                onPress={this._onEndButtonPress}>
                <Text style={{ fontSize: 12, color: Colors.snow }}>End</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.optionButton, { backgroundColor: Colors.facebook }]}
                onPress={this._onMuteButtonPress}>
                <Text style={{ fontSize: 12, color: Colors.snow }}>{isAudioEnabled ? "Mute" : "Unmute"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.optionButton, { backgroundColor: Colors.bloodOrange }]}
                onPress={this._onFlipButtonPress}>
                <Text style={{ fontSize: 12, color: Colors.snow }}>Flip</Text>
              </TouchableOpacity>
              <TwilioVideoLocalView
                enabled={true}
                style={styles.localVideo}
              />
            </View>
          </View>
        </View>
      )
    }
    return (
      
      <View style={styles.maincontainer}>
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
    backgroundColor: 'white'
  },
  callContainer: {
    flex: 1,
    position: "absolute",
    bottom: 0,
    top: 0,
    left: 0,
    right: 0
  },
  optionsContainer: {
    position: "absolute",
    left: 0,
    bottom: 0,
    right: 0,
    height: 100,
    backgroundColor: 'transparent',
    flexDirection: "row",
    alignItems: "center",
    justifyContent: 'center'
  },
  maincontainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  textTop: {
    fontSize: 30,
    color: 'white',
    marginTop: 10
  },
  viewTime: {
    fontSize: 30,
    height: '30%',
    color: 'white',
    textAlign: 'center'
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    height: '40%'
  },
  textButtons: {
    fontSize: 25,
    color: 'white',
    marginTop: 10
  },
  viewAnswer: {
    width: '50%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  viewDecline: {
    width: '50%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  localVideo: {
    flex: 1,
    width: width / 3,
    height: width / 2,
    position: "absolute",
    right: 10,
    bottom: 110,
    borderRadius: 10
  },
  remoteGrid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: 'wrap'
  },
  remoteVideo: {
    width,
    height
  },
  optionButton: {
    width: 60,
    height: 60,
    marginLeft: 10,
    marginRight: 10,
    borderRadius: 100 / 2,
    backgroundColor: 'grey',
    justifyContent: 'center',
    alignItems: "center"
  }
});
