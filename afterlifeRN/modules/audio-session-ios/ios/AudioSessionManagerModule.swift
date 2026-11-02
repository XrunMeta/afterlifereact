

import AVFoundation
import ExpoModulesCore

public class AudioSessionManagerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AudioSessionManager")

    AsyncFunction("enableCallMode") { (promise: Promise) in
      let session = AVAudioSession.sharedInstance()
      do {
        try session.setCategory(
          .playAndRecord,
          mode: .voiceChat,
          options: [.defaultToSpeaker, .allowBluetooth]
        )
        try session.setActive(true, options: [])
        let info: [String: Any] = [
          "category": session.category.rawValue,
          "mode": session.mode.rawValue,
          "sampleRate": session.sampleRate,
          "outputRoute": session.currentRoute.outputs.map { $0.portType.rawValue },
        ]
        promise.resolve(info)
      } catch {
        promise.reject("AUDIO_SESSION", (error as NSError).localizedDescription)
      }
    }

    AsyncFunction("disableCallMode") { (promise: Promise) in
      let session = AVAudioSession.sharedInstance()
      do {
        try session.setActive(false, options: [.notifyOthersOnDeactivation])
        promise.resolve(nil)
      } catch {
        promise.reject("AUDIO_SESSION", (error as NSError).localizedDescription)
      }
    }

    AsyncFunction("describe") { () -> [String: Any] in
      let session = AVAudioSession.sharedInstance()
      return [
        "category": session.category.rawValue,
        "mode": session.mode.rawValue,
        "sampleRate": session.sampleRate,
        "outputRoute": session.currentRoute.outputs.map { $0.portType.rawValue },
        "inputRoute": session.currentRoute.inputs.map { $0.portType.rawValue },
      ]
    }
  }
}
