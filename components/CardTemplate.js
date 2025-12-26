const CARD_WIDTH = 1080
const CARD_HEIGHT = 1080

// Streetwear color palettes - solid, bold, high contrast
const STREETWEAR_COLORS = [
  { bg: '#000000', text: '#ffffff', accent: '#ffffff' }, // Black
  { bg: '#ffffff', text: '#000000', accent: '#ff0000' }, // White
  { bg: '#1a1a1a', text: '#ffffff', accent: '#00ff00' }, // Dark gray
  { bg: '#2c2c2c', text: '#ffffff', accent: '#ffff00' }, // Charcoal
  { bg: '#0a0a0a', text: '#ffffff', accent: '#ff00ff' }, // Deep black
  { bg: '#ffffff', text: '#000000', accent: '#0000ff' }, // White alt
]

export default function CardTemplate({ 
  children, 
  gradientIndex = 0, 
  className = '',
  id = '',
  bgColor = null,
  textColor = null
}) {
  const colorScheme = bgColor 
    ? { bg: bgColor, text: textColor || '#ffffff', accent: '#ffffff' }
    : STREETWEAR_COLORS[gradientIndex % STREETWEAR_COLORS.length]

  // Add subtle noise texture for streetwear aesthetic
  const noisePattern = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")`

  return (
    <div
      id={id}
      className={`relative flex flex-col items-center justify-center overflow-hidden ${className}`}
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        background: colorScheme.bg,
        backgroundImage: noisePattern,
        minWidth: CARD_WIDTH,
        minHeight: CARD_HEIGHT,
        color: colorScheme.text,
      }}
    >
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-12" style={{ color: colorScheme.text }}>
        {children}
      </div>
    </div>
  )
}

export { CARD_WIDTH, CARD_HEIGHT }

