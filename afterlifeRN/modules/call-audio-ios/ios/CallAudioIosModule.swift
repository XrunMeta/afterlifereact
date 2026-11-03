import AVFoundation
import ExpoModulesCore
import WebRTC

public class CallAudioIosModule: Module {
  private static let holdingTrial = "WebRTC-Audio-iOS-Holding"

  public func definition() -> ModuleDefinition {
    Name("CallAudioIos")

    Function("restartPlayout") { (reason: String) -> Bool in
      RTCInitFieldTrialDictionary([
        kRTCFieldTrialUseNWPathMonitor: kRTCFieldTrialEnabledValue,
        CallAudioIosModule.holdingTrial: kRTCFieldTrialEnabledValue,
      ])
      let avSession = AVAudioSession.sharedInstance()
      let rtc = RTCAudioSession.sharedInstance()
      NSLog(
        "[CallAudioIos] restartPlayout reason=%@ category=%@ mode=%@ otherAudio=%d",
        reason, avSession.category.rawValue, avSession.mode.rawValue, avSession.isOtherAudioPlaying ? 1 : 0
      )

      rtc.audioSessionDidDeactivate(avSession)
      rtc.audioSessionDidActivate(avSession)
      return true
    }
  }
}
