import React from 'react';
import { View, StyleSheet } from 'react-native';

interface Props {
  pct: number;   // 0-100
  color: string;
  height?: number;
}

export default function ProgressBar({ pct, color, height = 6 }: Props) {
  return (
    <View style={[styles.track, { height }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${Math.max(0, Math.min(100, pct))}%`,
            backgroundColor: color,
            height,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: '#1e3a5f',
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    borderRadius: 4,
  },
});
