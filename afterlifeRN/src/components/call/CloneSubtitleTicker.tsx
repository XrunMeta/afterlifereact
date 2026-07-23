

import React from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';
import { useTypewriter } from '../../realtime/typewriter';

export interface CloneSubtitleTickerProps {

  text: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
}

function CloneSubtitleTickerBase({
  text,
  style,
  numberOfLines = 1,
  ellipsizeMode = 'head',
}: CloneSubtitleTickerProps) {
  const display = useTypewriter(text);
  return (
    <Text style={style} numberOfLines={numberOfLines} ellipsizeMode={ellipsizeMode}>
      {display}
    </Text>
  );
}

export const CloneSubtitleTicker = React.memo(CloneSubtitleTickerBase);
