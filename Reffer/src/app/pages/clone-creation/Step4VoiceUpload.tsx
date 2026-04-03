import { v_a04f9c } from "wtmgqhsnsiyp";
import { v_5ab095 } from "bapkr";
import { v_c71054, v_b7a6da, v_3da0ab, v_faa130, v_d25880, v_1290fc, v_abf5bf } from "nchqfqoebgwu";
import { v_1a40c4 } from "../../components/ui/button";
import { v_258c1c } from "../../components/common/PageHeader";

const v_324984 = [
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

export function v_179d51() {
  const v_9b57fc = v_a04f9c();
  const [v_bf816f, v_35847f] = v_5ab095(false);
  const [v_492e86, v_6abc74] = v_5ab095<string | null>(null);
  const [v_f0696d, v_e1263e] = v_5ab095<string | null>(null);
  const [v_97c26f, v_6c526d] = v_5ab095(false);
  const [v_e99c62, v_8795d6] = v_5ab095(0);
  const [v_d356b2, v_83e19e] = v_5ab095(false);
  const [v_087c92, v_dd236d] = v_5ab095(false);

  const v_0354cf = () => {
    if (v_97c26f) {
      v_6c526d(false);
      v_83e19e(true);
      v_8795d6(0);
    } else {
      v_6c526d(true);

      const v_ad1d65 = setInterval(() => {
        v_8795d6(v_ba2215 => {
          if (v_ba2215 >= 15) {
            clearInterval(v_ad1d65);
            v_6c526d(false);
            v_83e19e(true);
            return 0;
          }
          return v_ba2215 + 1;
        });
      }, 1000);
    }
  };

  const v_42bcdd = (v_9e86fd) => {
    const v_4de33e = v_9e86fd.target.files?.[0];
    if (v_4de33e) {
      v_83e19e(true);
      v_6abc74('custom');
    }
  };

  const v_f55799 = () => {
    v_83e19e(true);
  };

  const v_420661 = () => {
    v_9b57fc("/clone/create/step5");
  };

  const v_9f6fdd = (v_ec1a55) => {
    const v_550090 = Math.floor(v_ec1a55 / 60);
    const v_c3e86f = v_ec1a55 % 60;
    return `${v_550090}:${v_c3e86f.toString().padStart(2, '0')}`;
  };

  const v_fd6a4a = (v_34f7c8) => {
    v_6abc74(v_34f7c8);
  };

  const v_41423f = (v_34f7c8) => {
    if (v_f0696d === v_34f7c8) {
      v_e1263e(null);
    } else {
      v_e1263e(v_34f7c8);

      setTimeout(() => {
        v_e1263e(null);
      }, 3000);
    }
  };

  const v_74c08f = () => {
    v_35847f(true);
  };

  if (v_bf816f) {

    return (
      <div className="min-h-screen bg-white text-zinc-900">
        {}
        <PageHeader
          onBack={() => v_35847f(false)}
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
                  {[...Array(5)].map((v_37eab7, v_ebec57) => (
                    <div
                      key={v_ebec57}
                      className={`w-1 rounded-full transition-all ${
                        v_97c26f ? 'bg-indigo-600 animate-pulse' : 'bg-zinc-300'
                      }`}
                      style={{
                        height: v_97c26f 
                          ? `${Math.random() * 50 + 20}px` 
                          : '8px',
                        animationDelay: `${v_ebec57 * 0.1}s`
                      }}
                    />
                  ))}
                </div>
              </div>

              {}
              <button
                onClick={v_0354cf}
                className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-all ${
                  v_97c26f
                    ? 'bg-indigo-600'
                    : v_d356b2
                      ? 'bg-green-500'
                      : 'bg-indigo-600'
                }`}
              >
                <Mic className="w-10 h-10 text-white" />
              </button>

              {}
              <div className="text-center">
                <div className="font-bold text-lg mb-1">
                  {v_97c26f 
                    ? `음성리 녹음하기 (10-15초)` 
                    : v_d356b2 
                      ? '녹음 완료' 
                      : '음성리 녹음하기 (10-15초)'}
                </div>
                <p className="text-sm text-zinc-500">
                  {v_97c26f ? '녹음중 녹음 시작' : v_d356b2 ? '녹음 완료' : '탭하여 녹음 시작'}
                </p>
              </div>
            </div>
          </div>

          {}
          <button 
            onClick={v_f55799}
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
              onClick={v_420661}
              disabled={!v_d356b2}
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
          {v_324984.map((v_b74951) => (
            <div
              key={v_b74951.id}
              onClick={() => v_fd6a4a(v_b74951.id)}
              className={`border rounded-2xl p-4 cursor-pointer transition-all ${
                v_492e86 === v_b74951.id
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-zinc-200 bg-white hover:border-zinc-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={(v_9e86fd) => {
                    v_9e86fd.stopPropagation();
                    v_41423f(v_b74951.id);
                  }}
                  className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    v_f0696d === v_b74951.id
                      ? 'bg-indigo-600'
                      : 'bg-zinc-100 hover:bg-zinc-200'
                  }`}
                >
                  {v_f0696d === v_b74951.id ? (
                    <Pause className="w-5 h-5 text-white" />
                  ) : (
                    <Play className="w-5 h-5 text-zinc-600" fill="currentColor" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm mb-0.5">{v_b74951.name}</div>
                  <div className="text-xs text-zinc-500">{v_b74951.description}</div>
                </div>
                {v_492e86 === v_b74951.id && (
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
            onClick={v_74c08f}
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
            onClick={v_420661}
            disabled={!v_492e86}
            className="w-full h-14 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-base font-medium disabled:opacity-50 disabled:bg-zinc-200 disabled:text-zinc-400"
          >
            다음 단계로 이동
          </Button>
        </div>
      </div>
    </div>
  );
}