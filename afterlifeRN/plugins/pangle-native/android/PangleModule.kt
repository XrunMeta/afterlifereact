

package run.xrun.afterlifeRN

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.util.Log
import com.bytedance.sdk.openadsdk.api.init.PAGConfig
import com.bytedance.sdk.openadsdk.api.init.PAGSdk
import com.bytedance.sdk.openadsdk.api.reward.PAGRewardItem
import com.bytedance.sdk.openadsdk.api.reward.PAGRewardedAd
import com.bytedance.sdk.openadsdk.api.reward.PAGRewardedAdInteractionListener
import com.bytedance.sdk.openadsdk.api.reward.PAGRewardedAdLoadListener
import com.bytedance.sdk.openadsdk.api.reward.PAGRewardedRequest
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

class PangleModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), LifecycleEventListener {

    private val reactContext: ReactApplicationContext = reactContext
    private var isInitialized = false
    private var rewardedAd: PAGRewardedAd? = null
    private var currentRewardedAdUnitId: String? = null

    init {
        reactContext.addLifecycleEventListener(this)
    }

    override fun getName(): String = "PangleModule"

    override fun onHostResume() {}
    override fun onHostPause() {}
    override fun onHostDestroy() {}

    @ReactMethod
    fun initialize(promise: Promise) {
        try {
            if (isInitialized) {
                promise.resolve(true)
                return
            }
            val context = reactApplicationContext.applicationContext
            val appId = getAppIdFromManifest(context)
            if (appId.isNullOrEmpty()) {
                promise.reject("INIT_ERROR", "Pangle App ID 를 AndroidManifest 에서 찾을 수 없어요.")
                return
            }
            Log.d(TAG, "Pangle 초기화 시작, App ID: $appId")
            val config = PAGConfig.Builder()
                .appId(appId)
                .debugLog(BuildConfig.DEBUG)
                .supportMultiProcess(false)
                .build()
            PAGSdk.init(context, config, object : PAGSdk.PAGInitCallback {
                override fun success() {
                    Log.d(TAG, "Pangle 초기화 성공")
                    isInitialized = true
                    promise.resolve(true)
                }
                override fun fail(code: Int, msg: String) {
                    val error = "Pangle 초기화 실패: $msg (code=$code)"
                    Log.e(TAG, error)
                    promise.reject("INIT_ERROR", error)
                }
            })
        } catch (e: Exception) {
            Log.e(TAG, "초기화 예외", e)
            promise.reject("INIT_ERROR", e.message ?: "unknown")
        }
    }

    @ReactMethod
    fun isReady(promise: Promise) {
        promise.resolve(isInitialized && PAGSdk.isInitSuccess())
    }

    @ReactMethod
    fun loadRewardedAd(adUnitId: String, promise: Promise) {
        try {
            if (!isInitialized || !PAGSdk.isInitSuccess()) {
                promise.reject("NOT_INITIALIZED", "Pangle 미초기화")
                return
            }
            Log.d(TAG, "rewarded load: $adUnitId")
            currentRewardedAdUnitId = adUnitId
            val request = PAGRewardedRequest()
            PAGRewardedAd.loadAd(adUnitId, request, object : PAGRewardedAdLoadListener {
                override fun onError(code: Int, message: String) {
                    Log.e(TAG, "rewarded load error: $message ($code)")
                    sendEvent(
                        "onRewardedAdLoadError",
                        mapOf("adUnitId" to adUnitId, "errorCode" to code, "errorMsg" to message)
                    )
                    promise.reject("LOAD_ERROR", message)
                }
                override fun onAdLoaded(ad: PAGRewardedAd) {
                    Log.d(TAG, "rewarded loaded: $adUnitId")
                    rewardedAd = ad
                    setRewardListener(ad, adUnitId)
                    promise.resolve(true)
                }
            })
        } catch (e: Exception) {
            Log.e(TAG, "rewarded load 예외", e)
            promise.reject("LOAD_ERROR", e.message ?: "unknown")
        }
    }

    @ReactMethod
    fun showRewardedAd(adUnitId: String, promise: Promise) {
        try {
            val ad = rewardedAd
            if (ad == null) {
                promise.reject("AD_NOT_LOADED", "광고 미로드")
                return
            }
            val activity = reactApplicationContext.currentActivity
            if (activity == null) {
                promise.reject("NO_ACTIVITY", "Activity 없음")
                return
            }
            Handler(Looper.getMainLooper()).post {
                try {
                    Log.d(TAG, "rewarded show: $adUnitId")
                    ad.show(activity)
                    promise.resolve(true)
                } catch (e: Exception) {
                    Log.e(TAG, "rewarded show 예외", e)
                    promise.reject("SHOW_ERROR", e.message ?: "unknown")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "rewarded show 외부 예외", e)
            promise.reject("SHOW_ERROR", e.message ?: "unknown")
        }
    }

    private fun setRewardListener(ad: PAGRewardedAd, adUnitId: String) {
        ad.setAdInteractionListener(object : PAGRewardedAdInteractionListener {
            override fun onAdShowed() {
                Log.d(TAG, "onAdShowed")
            }
            override fun onAdClicked() {
                Log.d(TAG, "onAdClicked")
            }
            override fun onAdDismissed() {
                Log.d(TAG, "onAdDismissed")
                sendEvent("onRewardedAdClose", mapOf("adUnitId" to adUnitId))
                rewardedAd = null
                currentRewardedAdUnitId = null
            }
            override fun onUserEarnedReward(rewardItem: PAGRewardItem) {
                Log.d(TAG, "onUserEarnedReward: ${rewardItem.rewardName}, ${rewardItem.rewardAmount}")
                sendEvent(
                    "onRewardedAdReward",
                    mapOf(
                        "adUnitId" to adUnitId,
                        "type" to rewardItem.rewardName,
                        "amount" to rewardItem.rewardAmount
                    )
                )
            }
            override fun onUserEarnedRewardFail(errorCode: Int, errorMsg: String) {
                Log.e(TAG, "onUserEarnedRewardFail: $errorMsg ($errorCode)")
            }
        })
    }

    private fun getAppIdFromManifest(context: Context): String? {
        return try {
            val info = context.packageManager.getApplicationInfo(
                context.packageName,
                android.content.pm.PackageManager.GET_META_DATA
            )
            val v = info.metaData?.get("com.bytedance.sdk.openadsdk.APP_ID")
            when (v) {
                is String -> v
                is Int -> v.toString()
                else -> null
            }
        } catch (e: Exception) {
            Log.e(TAG, "App ID 조회 실패", e)
            null
        }
    }

    private fun sendEvent(name: String, params: Map<String, Any?>) {
        reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(name, toWritableMap(params))
    }

    private fun toWritableMap(m: Map<String, Any?>): WritableMap {
        val map = Arguments.createMap()
        m.forEach { (k, v) ->
            when (v) {
                is String -> map.putString(k, v)
                is Int -> map.putInt(k, v)
                is Double -> map.putDouble(k, v)
                is Boolean -> map.putBoolean(k, v)
                null -> map.putNull(k)
                else -> map.putString(k, v.toString())
            }
        }
        return map
    }

    companion object {
        private const val TAG = "PangleModule"
    }
}
