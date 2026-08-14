import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../../theme/colors';

interface TimeRingProps {
  percentage: number; // 0 to 100 (100 = full time remaining)
  size?: number;
  label?: string;
}

export const TimeRing: React.FC<TimeRingProps> = React.memo(({ percentage, size = 48, label }) => {
  // Memoize color calculations to prevent recalculation on every render
  const { strokeColor, glowColor } = useMemo(() => {
    let stroke = Colors.ethereal[500]; // > 48h
    let glow = 'rgba(0, 206, 209, 0.6)';
    
    if (percentage <= 20) { // < 24h (Urgent)
      stroke = Colors.crimson[500];
      glow = 'rgba(220, 20, 60, 0.8)';
    } else if (percentage <= 50) { // 24-48h
      stroke = Colors.mystic[500];
      glow = 'rgba(107, 45, 92, 0.7)';
    }
    
    return { strokeColor: stroke, glowColor: glow };
  }, [percentage]);

  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={styles.svg}>
        {/* Background Ring */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.abyss3}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress Ring */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            shadowColor: glowColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 8,
          }}
        />
      </Svg>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.labelText, { color: strokeColor }]}>{label}</Text>
        </View>
      )}
    </View>
  );
});

TimeRing.displayName = 'TimeRing';

const styles = StyleSheet.create({
  container: { justifyContent: 'center', alignItems: 'center' },
  svg: { transform: [{ rotate: '-90deg' }] },
  labelContainer: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  labelText: { fontFamily: 'JetBrainsMono-Bold', fontSize: 10, fontWeight: 'bold' },
});
