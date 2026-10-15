

package run.xrun.afterlifeRN

import android.util.Log
import android.widget.FrameLayout
import com.bytedance.sdk.openadsdk.api.banner.PAGBannerAd
import com.bytedance.sdk.openadsdk.api.banner.PAGBannerAdInteractionListener
import com.bytedance.sdk.openadsdk.api.banner.PAGBannerAdLoadListener
import com.bytedance.sdk.openadsdk.api.banner.PAGBannerRequest
import com.bytedance.sdk.openadsdk.api.banner.PAGBannerSize
import com.bytedance.sdk.openadsdk.api.init.PAGSdk
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

class PangleBannerAdView(context: ThemedReactContext) : FrameLayout(context) {
    private var currentUnit: String? = null
    private var currentAd: PAGBannerAd? = null

    fun setAdUnitId(unit: String?) {
        if (unit.isNullOrEmpty()) return
        if (unit == currentUnit && currentAd != null) return
        currentUnit = unit
        if (!PAGSdk.isInitSuccess()) {
            Log.w(TAG, "PAGSdk 미초기화 — JS 쪽 initializePangle() 선행 필요. unit=$unit")
            return
        }
        loadBanner(unit)
    }

    private fun loadBanner(adUnitId: String) {
        val size = PAGBannerSize.BANNER_W_320_H_50
        val request = PAGBannerRequest(size)
        Log.d(TAG, "banner load start unit=$adUnitId size=320x50")
        PAGBannerAd.loadAd(adUnitId, request, object : PAGBannerAdLoadListener {
            override fun onError(code: Int, msg: String) {
                Log.e(TAG, "banner load error code=$code msg=$msg unit=$adUnitId")
            }
            override fun onAdLoaded(ad: PAGBannerAd) {
                Log.d(TAG, "banner loaded unit=$adUnitId")
                currentAd = ad
                ad.setAdInteractionListener(object : PAGBannerAdInteractionListener {
                    override fun onAdShowed() { Log.d(TAG, "banner shown") }
                    override fun onAdClicked() { Log.d(TAG, "banner clicked") }
                    override fun onAdDismissed() { Log.d(TAG, "banner dismissed") }
                })
                removeAllViews()
                val bannerView = ad.bannerView
                if (bannerView != null) {
                    addView(
                        bannerView,
                        LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT),
                    )
                } else {
                    Log.w(TAG, "banner loaded 됐으나 bannerView null")
                }
            }
        })
    }

    companion object { private const val TAG = "PangleBannerAd" }
}

class PangleBannerAdViewManager : SimpleViewManager<PangleBannerAdView>() {
    override fun getName(): String = "PangleBannerAdView"

    override fun createViewInstance(reactContext: ThemedReactContext): PangleBannerAdView =
        PangleBannerAdView(reactContext)

    @ReactProp(name = "adUnitId")
    fun setAdUnitId(view: PangleBannerAdView, unit: String?) {
        view.setAdUnitId(unit)
    }
}
