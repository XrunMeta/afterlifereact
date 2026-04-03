import { useNavigate } from "react-router";
import { useState } from "react";
import { ArrowLeft, Mic, Upload, Play, Pause, Trash2, Volume2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { PageHeader } from "../../components/common/PageHeader";

const SAMPLE_VOICES = [
  { id: 'nova', name: 'Nova (노바)', description: '차분하고 부드러우며 신뢰감을 주는 목소리' },
  { id: 'ursa', name: 'Ursa (어사)', description: '따뜻하고 다정한 느낌의 목소리' },
  { id: 'vega', name: 'Vega (베가)', description: '밝고 경쾌하며 에너지가 넘치는 목소리' },
  { id: 'lyra', name: 'Lyra (라이라)', description: '지적이고 차분한 톤의 목소리' },
  { id: 'arcturus', name: 'Arcturus (아크투루스)', description: '자신감 있고 당당한 느낌의 목소리' },
  { id: 'capella', name: 'Capella (카펠라)', description: '부드러우면서도 활기찬 목소리' },
  { id: 'orion', name: 'Orion (오리온)', description: '깊고 울림이 있는 중저음의 목소리' },
  { id: 'pegasus', name: 'Pegasus (페가수스)', description: '부드럽고 친근한 남성 목소리' },
  { id: 'sirius', name: 'Sirius (시리우스)', description: '세련되고 현대적인 느낌의 목소리' },
  { id: 'eclipse', name: 'Eclipse (이클립스)', description: '개성 있고 힘 있는 목소리' },
];

export function Step4VoiceUpload() {
  const navigate = useNavigate();
  const [showCustomUpload, setShowCustomUpload] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setHasRecording(true);
      setRecordingTime(0);
    } else {
      setIsRecording(true);

      const interval = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 15) {
            clearInterval(interval);
            setIsRecording(false);
            setHasRecording(true);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setHasRecording(true);
      setSelectedVoice('custom');
    }
  };

  const handleAudioUploadClick = () => {
    setHasRecording(true);
  };

  const handleNext = () => {
    navigate("/clone/create/step5");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVoiceSelect = (voiceId: string) => {
    setSelectedVoice(voiceId);
  };

  const handlePlayVoice = (voiceId: string) => {
    if (playingVoice === voiceId) {
      setPlayingVoice(null);
    } else {
      setPlayingVoice(voiceId);

      setTimeout(() => {
        setPlayingVoice(null);
      }, 3000);
    }
  };

  const handleCustomUploadClick = () => {
    setShowCustomUpload(true);
  };

  if (showCustomUpload) {

    return (
      <div className="min-h-screen bg-white text-zinc-900">
        {}
        <PageHeader
          onBack={() => setShowCustomUpload(false)}
          title="직접 오디오 업로드"
          stepInfo={{ current: 4, total: 7 }}
        />

        <div className="px-6 py-8 max-w-md mx-auto pb-32">
          <h2 className="text-2xl font-bold mb-2">페르소나의 목소리를<br />들려주세요.</h2>
          <p className="text-sm text-zinc-500 mb-8">
            10초에서 15초 사이의 선명한 음성이 필요합니다.<br />
            조용한 곳에서 차분한 분위기를 읽어주세요.
          </p>

          {}
          <div className="mb-8">
            <div className="aspect-square rounded-3xl bg-zinc-50 flex flex-col items-center justify-center p-8 mb-6">
              {}
              <div className="mb-8">
                <div className="flex items-center justify-center gap-1 h-16">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-full transition-all ${
                        isRecording ? 'bg-indigo-600 animate-pulse' : 'bg-zinc-300'
                      }`}
                      style={{
                        height: isRecording 
                          ? `${Math.random() * 50 + 20}px` 
                          : '8px',
                        animationDelay: `${i * 0.1}s`
                      }}
                    />
                  ))}
                </div>
              </div>

              {}
              <button
                onClick={toggleRecording}
                className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-all ${
                  isRecording
                    ? 'bg-indigo-600'
                    : hasRecording
                      ? 'bg-green-500'
                      : 'bg-indigo-600'
                }`}
              >
                <Mic className="w-10 h-10 text-white" />
              </button>

              {}
              <div className="text-center">
                <div className="font-bold text-lg mb-1">
                  {isRecording 
                    ? `음성리 녹음하기 (10-15초)` 
                    : hasRecording 
                      ? '녹음 완료' 
                      : '음성리 녹음하기 (10-15초)'}
                </div>
                <p className="text-sm text-zinc-500">
                  {isRecording ? '녹음중 녹음 시작' : hasRecording ? '녹음 완료' : '탭하여 녹음 시작'}
                </p>
              </div>
            </div>
          </div>

          {}
          <button 
            onClick={handleAudioUploadClick}
            className="flex items-center w-full gap-3 h-14 px-6 bg-white border border-zinc-200 rounded-2xl hover:bg-zinc-50 transition-colors cursor-pointer mb-8"
          >
            <Upload className="w-5 h-5 text-zinc-600" />
            <span className="font-medium text-zinc-900">오디오 파일 업로드</span>
            <svg className="ml-auto w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {}
          <div className="bg-indigo-50 rounded-2xl p-6 mb-8">
            <h3 className="font-bold text-sm text-indigo-600 mb-3">녹음 스크립트</h3>
            <p className="text-sm text-zinc-700 leading-relaxed">
              "안녕하세요. 새로운 인저녀를 클로잉 샘플을 
              시작합니다. 오늘도 날씨는 맑고 공기는 
              좋습니다. 지의 목소리가 명확하게 들리시나요?"
            </p>
          </div>

          {}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-zinc-200">
            <Button
              onClick={handleNext}
              disabled={!hasRecording}
              className="w-full h-14 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-base font-medium disabled:opacity-50 disabled:bg-zinc-200 disabled:text-zinc-400"
            >
              다음 단계로 이동
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {}
      <PageHeader
        title="음성 업로드"
        stepInfo={{ current: 4, total: 7 }}
      />

      <div className="px-6 py-8 max-w-md mx-auto pb-32">
        <h2 className="text-2xl font-bold mb-2">페르소나의 목소리를<br />선택하세요.</h2>
        <p className="text-sm text-zinc-500 mb-8">
          샘플 목소리를 들어보고 선택하거나,<br />
          직접 음성을 업로드할 수 있습니다.
        </p>

        {}
        <div className="space-y-3 mb-6">
          {SAMPLE_VOICES.map((voice) => (
            <div
              key={voice.id}
              onClick={() => handleVoiceSelect(voice.id)}
              className={`border rounded-2xl p-4 cursor-pointer transition-all ${
                selectedVoice === voice.id
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-zinc-200 bg-white hover:border-zinc-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayVoice(voice.id);
                  }}
                  className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    playingVoice === voice.id
                      ? 'bg-indigo-600'
                      : 'bg-zinc-100 hover:bg-zinc-200'
                  }`}
                >
                  {playingVoice === voice.id ? (
                    <Pause className="w-5 h-5 text-white" />
                  ) : (
                    <Play className="w-5 h-5 text-zinc-600" fill="currentColor" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm mb-0.5">{voice.name}</div>
                  <div className="text-xs text-zinc-500">{voice.description}</div>
                </div>
                {selectedVoice === voice.id && (
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          ))}

          {}
          <div
            onClick={handleCustomUploadClick}
            className="border border-zinc-300 border-dashed rounded-2xl p-4 cursor-pointer hover:border-indigo-600 hover:bg-indigo-50/50 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center">
                <Upload className="w-5 h-5 text-zinc-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm mb-0.5">직접 오디오 업로드</div>
                <div className="text-xs text-zinc-500">녹음하거나 파일을 업로드하세요</div>
              </div>
              <svg className="flex-shrink-0 w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>

        {}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-zinc-200">
          <Button
            onClick={handleNext}
            disabled={!selectedVoice}
            className="w-full h-14 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-base font-medium disabled:opacity-50 disabled:bg-zinc-200 disabled:text-zinc-400"
          >
            다음 단계로 이동
          </Button>
        </div>
      </div>
    </div>
  );
}