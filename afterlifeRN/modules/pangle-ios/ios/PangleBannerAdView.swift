
import ExpoModulesCore
import PAGAdSDK
import UIKit

class PangleBannerAdView: ExpoView {
  private var currentUnit: String?
  private var bannerAd: PAGBannerAd?

  func setAdUnitId(_ unit: String) {
    clipsToBounds = true
    if unit.isEmpty || unit == currentUnit { return }
    currentUnit = unit
    PangleSdk.ensureInitialized { [weak self] ok, message in
      guard let self = self else { return }
      if !ok {
        NSLog("[PangleBannerAd] SDK 초기화 실패: \(message ?? "-")")
        return
      }
      self.load(unit)
    }
  }

  private func load(_ unit: String) {
    let request = PAGBannerRequest(bannerSize: kPAGBannerSize320x50)
    PAGBannerAd.load(withSlotID: unit, request: request) { [weak self] ad, error in
      DispatchQueue.main.async {
        guard let self = self else { return }
        if let error = error as NSError? {
          NSLog("[PangleBannerAd] load error code=\(error.code) msg=\(error.localizedDescription) unit=\(unit)")
          return
        }
        guard let ad = ad else { return }
        ad.rootViewController = PangleSdk.topViewController()
        self.bannerAd = ad
        self.subviews.forEach { $0.removeFromSuperview() }
        let view = ad.bannerView
        view.frame = self.bounds
        view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        self.addSubview(view)
        NSLog("[PangleBannerAd] loaded unit=\(unit)")
      }
    }
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    bannerAd?.bannerView.frame = bounds
  }
}
