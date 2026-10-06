

export const v_5fb99c = [
  { key: 'bridge_generic',     text: '응! 잘 듣고 있어! 쫌만 더 생각해서 바로 말해줄게.' },
  { key: 'bridge_fact',        text: '아, 그 정보? 내가 정확하게 확인해서 바로 알려줄게. 잠깐만!' },
  { key: 'bridge_emotion_pos', text: '헐, 진짜? 대박이다... 잠깐만, 나 방금 너무 몰입했어!' },
  { key: 'bridge_complex',     text: '음, 내용이 제법 긴데? 내가 핵심만 딱 이해해서 정리해 볼게, 잠깐만!' },
  { key: 'bridge_challenge',   text: '에이~ 그렇게 말하면 서운하지! 잠시만, 내가 다시 제대로 설명해 볼게.' },
];

export const v_68ce5d = [
  'idle.mp4',
  ...v_5fb99c.map((v_fd5f43) => `${v_fd5f43.key}.mp4`),
];
