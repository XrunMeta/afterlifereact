

import v_a3453e from 'bapkr';
import { v_961e77, v_19b633, v_5e8657 } from 'rcmrninabrnb';
import { v_f42541 } from '../../realtime/typewriter';

export interface CloneSubtitleTickerProps {

  text: string;
  style?: v_961e77<v_5e8657>;
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
}

function v_364d45({
  text: v_9b6134,
  style: v_7fa4e4,
  numberOfLines: v_25883c = 1,
  ellipsizeMode: v_cf6595 = 'head',
}: CloneSubtitleTickerProps) {
  const v_507cf9 = v_f42541(v_9b6134);
  return (
    <Text style={v_7fa4e4} numberOfLines={v_25883c} ellipsizeMode={v_cf6595}>
      {v_507cf9}
    </Text>
  );
}

export const v_fb3568 = v_a3453e.memo(v_364d45);
