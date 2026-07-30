import { StyleSheet } from 'react-native';

export const Typography = StyleSheet.create({
  h1: { fontSize: 28, fontWeight: '800', color: '#F8F8FF' },
  h2: { fontSize: 22, fontWeight: '700', color: '#F8F8FF' },
  h3: { fontSize: 16, fontWeight: '700', color: '#F8F8FF' },
  body: { fontSize: 14, fontWeight: '400', color: '#F8F8FF' },
  caption: { fontSize: 12, fontWeight: '500', color: 'rgba(248, 248, 255, 0.6)' },
  
  // Monospace for Timers & Data
  timer: { fontSize: 32, fontWeight: '700', color: '#F8F8FF' }, // Will apply JetBrains Mono font family in layout
  data: { fontSize: 14, fontWeight: '600', color: '#F8F8FF' },
});
