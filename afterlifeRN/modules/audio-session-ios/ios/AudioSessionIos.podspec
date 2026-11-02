# 2026-11-02: iOS 통화 음성 재생 안 되는 증상 원인 특정 후 수정 — AVAudioSession 네이티브 세팅.
#   react-native-webrtc / InCallManager 가 AVAudioSession category 를 .playAndRecord 로 세팅해도
#   remote audio 재생이 깨지는 증상 — 직접 setCategory 를 명시 호출해 category 를 강제한다.
Pod::Spec.new do |s|
  s.name           = 'AudioSessionIos'
  s.version        = '1.0.0'
  s.summary        = 'AVAudioSession playAndRecord forcer for afterlife call audio (iOS)'
  s.description    = 'Explicitly sets AVAudioSession category .playAndRecord + .voiceChat + .defaultToSpeaker for WebRTC remote audio playback.'
  s.author         = 'afterlife'
  s.homepage       = 'https://xrun.run'
  s.license        = { :type => 'UNLICENSED' }
  s.platforms      = { :ios => '15.1' }
  s.source         = { :git => '' }
  s.static_framework = true
  s.swift_version  = '5.9'

  s.dependency 'ExpoModulesCore'

  s.source_files = '**/*.{h,m,mm,swift}'
end
