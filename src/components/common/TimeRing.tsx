import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../../theme/colors';

interface TimeRingProps {
  percentage: number;
  label: string;
  size?: number;
  isExpired?: boolean;
}

export const TimeRing: React.FC<TimeRingProps> = React.memo(({ 
  percentage, 
  label, 
  size = 48,
  isExpired = false 
}) => {
  const { strokeColor } = useMemo(() => {
    if (isExpired) {
      return { strokeColor: Colors.crimson[500] };
    }
    
    if (percentage <= 20) {
      return { strokeColor: Colors.crimson[500] };
    } else if (percentage <= 50) {
      return { strokeColor: Colors.mystic[500] };
    } else {
      return { strokeColor: Colors.ethereal[500] };
    }
  }, [percentage, isExpired]);

  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={styles.svg}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.abyss3}
          strokeWidth={strokeWidth}
          fill="none"
        />
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
        />
      </Svg>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.labelText, { color: isExpired ? Colors.crimson[400] : strokeColor }]}>
            {label}
          </Text>
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