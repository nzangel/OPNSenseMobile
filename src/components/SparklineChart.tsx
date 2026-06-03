import React from 'react';
import { View, StyleSheet } from 'react-native';

interface Props {
  data: number[];
  color: string;
  height?: number;
  min?: number;
  max?: number;
}

/**
 * Sparkline en pur React Native — pas de SVG, pas de module natif.
 * Chaque point = une barre verticale fine avec hauteur proportionnelle à la valeur.
 */
export default function SparklineChart({
  data,
  color,
  height = 48,
  min = 0,
  max = 100,
}: Props) {
  if (data.length === 0) {
    return <View style={{ height }} />;
  }

  const range = max - min || 1;
  // On affiche les 60 derniers points max
  const visible = data.slice(-60);

  return (
    <View style={[styles.container, { height }]}>
      {visible.map((value, i) => {
        const pct = Math.max(0, Math.min(1, (value - min) / range));
        const barH = Math.max(2, pct * height);
        const opacity = 0.35 + pct * 0.65; // plus la valeur est haute, plus c'est opaque

        return (
          <View key={i} style={styles.barWrap}>
            <View
              style={[
                styles.bar,
                {
                  height: barH,
                  backgroundColor: color,
                  opacity,
                },
              ]}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: '100%',
    overflow: 'hidden',
  },
  barWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 0.5,
  },
  bar: {
    width: '100%',
    borderRadius: 1,
    minHeight: 2,
  },
});
