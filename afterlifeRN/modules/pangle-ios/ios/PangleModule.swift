

import ExpoModulesCore
import PAGAdSDK
import UIKit

public class PangleModule: Module {
  fileprivate var rewardedAd: PAGRewardedAd?
  fileprivate var rewardedDelegate: PangleRewardedDelegate?

  public func definition() -> ModuleDefinition {
    Name("PangleModule")

    Events("onRewardedAdClose", "onRewardedAdLoadError", "onRewardedAdReward")

    AsyncFunction("initialize") { (promise: Promise) in
      PangleSdk.ensureInitialized { ok, message in
        if ok {
          promise.resolve(true)
        } else {
          promise.reject("INIT_ERROR", message ?? "Pangle 초기화 실패")
        }
      }
    }

    AsyncFunction("isReady") { () -> Bool in
      return PangleSdk.initialized
    }

    AsyncFunction("loadRewardedAd") { (adUnitId: String, promise: Promise) in
      guard PangleSdk.initialized else {
        promise.reject("NOT_INITIALIZED", "Pangle 미초기화")
        return
      }
      DispatchQueue.main.async {
        PAGRewardedAd.load(withSlotID: adUnitId, request: PAGRewardedRequest()) { [weak self] ad, error in
          guard let self = self else { return }
          if let error = error as NSError? {
            self.sendEvent("onRewardedAdLoadError", [
              "adUnitId": adUnitId,
              "errorCode": error.code,
              "errorMsg": error.localizedDescription,
            ])
            promise.reject("LOAD_ERROR", error.localizedDescription)
            return
          }
          guard let ad = ad else {
            promise.reject("LOAD_ERROR", "광고 없음")
            return
          }
          let delegate = PangleRewardedDelegate(module: self, adUnitId: adUnitId)
          ad.delegate = delegate
          self.rewardedAd = ad
          self.rewardedDelegate = delegate
          promise.resolve(true)
        }
      }
    }

    AsyncFunction("showRewardedAd") { (adUnitId: String, promise: Promise) in
      DispatchQueue.main.async {
        guard let ad = self.rewardedAd else {
          promise.reject("AD_NOT_LOADED", "광고 미로드")
          return
        }
        guard let vc = PangleSdk.topViewController() else {
          promise.reject("NO_VIEW_CONTROLLER", "표시할 화면 없음")
          return
        }
        ad.present(fromRootViewController: vc)
        promise.resolve(true)
      }
    }

    View(PangleBannerAdView.self) {
      Prop("adUnitId") { (view: PangleBannerAdView, unit: String) in
        view.setAdUnitId(unit)
      }
    }
  }

  fileprivate func rewardedClosed(_ adUnitId: String) {
    sendEvent("onRewardedAdClose", ["adUnitId": adUnitId])
    rewardedAd = nil
    rewardedDelegate = nil
  }

  fileprivate func rewardedEarned(_ adUnitId: String, name: String, amount: Int) {
    sendEvent("onRewardedAdReward", ["adUnitId": adUnitId, "type": name, "amount": amount])
  }
}

final class PangleRewardedDelegate: NSObject, PAGRewardedAdDelegate {
  private weak var module: PangleModule?
  private let adUnitId: String

  init(module: PangleModule, adUnitId: String) {
    self.module = module
    self.adUnitId = adUnitId
  }

  func adDidDismiss(_ ad: PAGAdProtocol) {
    module?.rewardedClosed(adUnitId)
  }

  func rewardedAd(_ rewardedAd: PAGRewardedAd, userDidEarnReward rewardModel: PAGRewardModel) {
    module?.rewardedEarned(adUnitId, name: rewardModel.rewardName, amount: rewardModel.rewardAmount)
  }
}

enum PangleSdk {
  static var initialized = false
  private static var starting = false
  private static var waiters: [(Bool, String?) -> Void] = []

  static func appId() -> String {
    return (Bundle.main.object(forInfoDictionaryKey: "PangleAppId") as? String) ?? "8874758"
  }

  static func ensureInitialized(_ done: @escaping (Bool, String?) -> Void) {
    DispatchQueue.main.async {
      if initialized {
        done(true, nil)
        return
      }
      waiters.append(done)
      if starting { return }
      starting = true
      let config = PAGConfig.share()
      config.appID = appId()
      PAGSdk.start(with: config) { success, error in
        DispatchQueue.main.async {
          starting = false
          initialized = success
          let message = error?.localizedDescription
          let pending = waiters
          waiters = []
          pending.forEach { $0(success, message) }
        }
      }
    }
  }

  static func topViewController() -> UIViewController? {
    let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
    let window = scenes.flatMap { $0.windows }.first { $0.isKeyWindow } ?? scenes.first?.windows.first
    var top = window?.rootViewController
    while let presented = top?.presentedViewController {
      top = presented
    }
    return top
  }
}
