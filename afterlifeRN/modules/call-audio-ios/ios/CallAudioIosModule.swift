import AVFoundation
import ExpoModulesCore
import WebRTC

public class CallAudioIosModule: Module {
  public func definition() -> ModuleDefinition {
    Name("CallAudioIos")

    Function("isRestartTrialEnabled") { () -> Bool in
      return CallAudioIosAppDelegate.trialInstalled
    }

    Function("restartPlayout") { (reason: String) -> Bool in
      let avSession = AVAudioSession.sharedInstance()
      let rtc = RTCAudioSession.sharedInstance()
      NSLog(
        "[CallAudioIos] restartPlayout reason=%@ rtcActive=%d trial=%d category=%@ mode=%@",
        reason, rtc.isActive ? 1 : 0, CallAudioIosAppDelegate.trialInstalled ? 1 : 0,
        avSession.category.rawValue, avSession.mode.rawValue
      )
      guard rtc.isActive, CallAudioIosAppDelegate.trialInstalled else { return false }

      rtc.audioSessionDidDeactivate(avSession)
      rtc.audioSessionDidActivate(avSession)
      return true
    }
  }
}
