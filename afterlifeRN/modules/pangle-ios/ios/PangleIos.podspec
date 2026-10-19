# 2026-10-19: Pangle iOS (보상형 영상 + 배너) — 로컬 Expo 모듈.
#   Android 는 plugins/pangle-native (ReactPackage) 그대로. JS 계약(이벤트·메서드 이름)은 같게 맞춘다.
Pod::Spec.new do |s|
  s.name           = 'PangleIos'
  s.version        = '1.0.0'
  s.summary        = 'Pangle rewarded + banner ads for afterlife (iOS)'
  s.description    = 'Pangle rewarded + banner ads for afterlife (iOS)'
  s.author         = 'afterlife'
  s.homepage       = 'https://xrun.run'
  s.license        = { :type => 'UNLICENSED' }
  s.platforms      = { :ios => '15.1' }
  s.source         = { :git => '' }
  s.static_framework = true
  s.swift_version  = '5.9'

  s.dependency 'ExpoModulesCore'
  s.dependency 'Ads-Global'

  s.source_files = '**/*.{h,m,mm,swift}'
end
