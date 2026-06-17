import React from "react";
import Svg, { Circle, Path } from "react-native-svg";

interface Props { width: number; color?: string; opacity?: number }

export default function UpperBodyGuide({ width, color = "#FFFFFF", opacity = 0.6 }: Props) {
  const height = width * 2;
  return (
    <Svg width={width} height={height} viewBox="0 0 100 200" opacity={opacity}>
      <Circle cx="50" cy="48" r="24" stroke={color} strokeWidth="2.5" fill="none" />
      <Path
        d="M14 200 C14 150 26 120 50 120 C74 120 86 150 86 200"
        stroke={color}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}
