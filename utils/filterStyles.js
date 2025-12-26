// Popular photography filter styles - Enhanced with accurate film simulation recreations
// Based on CSSGram, CSSCO, and popular film simulation recreations
export const FILTER_STYLES = {
  fujifilm: {
    name: 'Fujifilm Classic Chrome',
    description: 'Warm film tones with teal-green shadows',
    filter: 'contrast(1.18) saturate(0.80) brightness(1.02)',
    mixBlendMode: 'normal',
    overlay: 'rgba(255, 250, 240, 0.12)',
    shadowOverlay: 'rgba(0, 125, 160, 0.15)',
  },
  kodak: {
    name: 'Kodak Portra',
    description: 'Warm, creamy, soft tones',
    filter: 'contrast(1.12) saturate(0.98) brightness(1.09) sepia(0.15)',
    mixBlendMode: 'normal',
    overlay: 'rgba(255, 252, 245, 0.20)',
  },
  vibrant: {
    name: 'Vibrant',
    description: 'Bold, saturated colors',
    filter: 'contrast(1.22) saturate(1.38) brightness(1.04)',
    mixBlendMode: 'normal',
  },
  bw: {
    name: 'Black & White',
    description: 'Classic monochrome',
    filter: 'grayscale(1) contrast(1.22) brightness(0.96)',
    mixBlendMode: 'normal',
  },
  cinematic: {
    name: 'Cinematic',
    description: 'Moody, desaturated with rich contrast',
    filter: 'contrast(1.32) saturate(0.62) brightness(0.90)',
    mixBlendMode: 'normal',
    overlay: 'rgba(40, 45, 75, 0.20)',
  },
  vintage: {
    name: 'Vintage',
    description: 'Retro, faded film look',
    filter: 'contrast(0.85) saturate(0.70) brightness(1.18) sepia(0.30) hue-rotate(-10deg)',
    mixBlendMode: 'multiply',
    overlay: 'rgba(240, 210, 165, 0.28)',
  },
  cool: {
    name: 'Cool Tones',
    description: 'Blue, crisp aesthetic',
    filter: 'contrast(1.15) saturate(0.85) brightness(1.05)',
    mixBlendMode: 'normal',
    overlay: 'rgba(140, 170, 245, 0.14)',
  },
  warm: {
    name: 'Warm Tones',
    description: 'Golden, cozy feeling',
    filter: 'contrast(1.08) saturate(1.15) brightness(1.09) sepia(0.08)',
    mixBlendMode: 'normal',
    overlay: 'rgba(255, 230, 190, 0.18)',
  },
  moody: {
    name: 'Dark & Moody',
    description: 'Dramatic shadows, deep tones',
    filter: 'contrast(1.38) saturate(0.80) brightness(0.80)',
    mixBlendMode: 'normal',
    overlay: 'rgba(12, 15, 32, 0.26)',
  },
  matte: {
    name: 'Matte',
    description: 'Soft, flat aesthetic',
    filter: 'contrast(0.90) saturate(0.85) brightness(1.05)',
    mixBlendMode: 'normal',
  },
  highContrast: {
    name: 'High Contrast',
    description: 'Punchy, bold contrast',
    filter: 'contrast(1.48) saturate(1.28) brightness(1.10)',
    mixBlendMode: 'normal',
  },
  desaturated: {
    name: 'Desaturated',
    description: 'Muted, minimalist colors',
    filter: 'contrast(1.15) saturate(0.52) brightness(1.02)',
    mixBlendMode: 'normal',
  },
}

export const getFilterStyle = (styleKey) => {
  return FILTER_STYLES[styleKey] || FILTER_STYLES.vibrant
}

export const getDefaultFilter = () => 'fujifilm'

