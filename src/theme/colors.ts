export const Colors = {
  // Backgrounds
  abyss: '#0A0A0F',
  abyss2: '#12121C',
  abyss3: '#1A1A28',
  
  // Accents
  crimson: {
    400: '#E84A6A',
    500: '#DC143C', // Urgent / High Priority
    600: '#B8102F',
  },
  mystic: {
    400: '#8A3F77',
    500: '#6B2D5C', // Secondary / Medium Priority
    600: '#4A1F40',
  },
  ethereal: {
    400: '#2DE5E8',
    500: '#00CED1', // Success / Streaks / Low Priority
    600: '#00A8AB',
  },
  
  // Text
  ghost: '#F8F8FF',
  ghostMuted: 'rgba(248, 248, 255, 0.6)',
  ghostDim: 'rgba(248, 248, 255, 0.3)',
} as const;
