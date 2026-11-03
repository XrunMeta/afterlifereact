# 2026-11-03 AFL-1075: iOS 통화 재생 엔진(WebRTC 오디오 유닛) 재시작 — 로컬 Expo 모듈.
#   광고 SDK 가 앱 오디오 세션을 몰래 꺼 WebRTC 재생이 멈췄을 때 다시 켠다.
Pod::Spec.new do |s|
  s.name           = 'CallAudioIos'
  s.version        = '1.0.0'
  s.summary        = 'Restart WebRTC playout after silent audio session deactivation (afterlife, iOS)'
  s.description    = 'Restart WebRTC playout after silent audio session deactivation (afterlife, iOS)'
  s.author         = 'afterlife'
  s.homepage       = 'https://xrun.run'
  s.license        = { :type => 'UNLICENSED' }
  s.platforms      = { :ios => '15.1' }
  s.source         = { :git => '' }
  s.static_framework = true
  s.swift_version  = '5.9'

  s.dependency 'ExpoModulesCore'
  # react-native-webrtc 와 같은 WebRTC 바이너리(같은 RTCAudioSession 싱글턴)를 쓴다.
  s.dependency 'JitsiWebRTC', '~> 124.0.0'

  s.source_files = '**/*.{h,m,mm,swift}'
end
