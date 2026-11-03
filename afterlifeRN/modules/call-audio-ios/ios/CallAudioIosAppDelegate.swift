import ExpoModulesCore
import WebRTC

public class CallAudioIosAppDelegate: ExpoAppDelegateSubscriber {
  static var trialInstalled = false

  public func application(
    _ application: UIApplication,
    willFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let sel = NSSelectorFromString("sharedInstance")
    guard
      let cls = NSClassFromString("WebRTCModuleOptions") as? NSObject.Type,
      cls.responds(to: sel),
      let options = cls.perform(sel)?.takeUnretainedValue() as? NSObject
    else {
      NSLog("[CallAudioIos] WebRTCModuleOptions 없음 — 재시작 필드트라이얼 미설정")
      return true
    }
    var trials = (options.value(forKey: "fieldTrials") as? [String: String]) ?? [
      kRTCFieldTrialUseNWPathMonitor: kRTCFieldTrialEnabledValue
    ]
    trials["WebRTC-Audio-iOS-Holding"] = kRTCFieldTrialEnabledValue
    options.setValue(trials, forKey: "fieldTrials")
    CallAudioIosAppDelegate.trialInstalled = true
    NSLog("[CallAudioIos] 필드트라이얼 설정: %@", trials.keys.sorted().joined(separator: ","))

    return true
  }
}
