import { useState } from 'react'
import CardTemplate, { CARD_WIDTH, CARD_HEIGHT } from './CardTemplate'
import { getFilterStyle } from '../utils/filterStyles'

// Calculate the grid dimensions needed for n images
// aspectRatio: 'square' or 'portrait'
function calculateGridSize(n, aspectRatio = 'square') {
  if (n <= 1) return { cols: 1, rows: 1 }
  
  if (aspectRatio === 'square') {
    // Square grids: 1x1, 2x2, 3x3, 4x4, etc.
    if (n <= 1) return { cols: 1, rows: 1 }
    if (n <= 4) return { cols: 2, rows: 2 }
    if (n <= 9) return { cols: 3, rows: 3 }
    if (n <= 16) return { cols: 4, rows: 4 }
    if (n <= 25) return { cols: 5, rows: 5 }
    if (n <= 36) return { cols: 6, rows: 6 }
    if (n <= 49) return { cols: 7, rows: 7 }
    if (n <= 64) return { cols: 8, rows: 8 }
    return { cols: 9, rows: 9 }
  } else {
    // Portrait grids: 2x3, 3x4, 4x5, etc. (taller than wide)
    // Find the smallest portrait grid that fits n images
    let cols = 2
    let rows = 3
    
    while (cols * rows < n && cols < 10 && rows < 10) {
      if (cols < rows - 1) {
        cols++
      } else {
        rows++
      }
    }
    
    // Ensure it's portrait (more rows than cols)
    if (cols >= rows) {
      rows = cols + 1
    }
    
    return { cols, rows }
  }
}

// Create grid-based layout
function createGridLayout(n, bounds, aspectRatio = 'square') {
  const { cols, rows } = calculateGridSize(n, aspectRatio)
  const points = []
  
  // Calculate cell dimensions
  const cellWidth = (bounds.maxX - bounds.minX) / cols
  const cellHeight = (bounds.maxY - bounds.minY) / rows
  
  // Shuffle the order of grid cells to place images randomly
  const cellIndices = []
  for (let i = 0; i < cols * rows; i++) {
    cellIndices.push(i)
  }
  // Shuffle
  for (let i = cellIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cellIndices[i], cellIndices[j]] = [cellIndices[j], cellIndices[i]]
  }
  
  // Place images in random grid cells
  for (let i = 0; i < n; i++) {
    const cellIdx = cellIndices[i]
    const row = Math.floor(cellIdx / cols)
    const col = cellIdx % cols
    
    // Center of the cell
    const cellCenterX = bounds.minX + (col + 0.5) * cellWidth
    const cellCenterY = bounds.minY + (row + 0.5) * cellHeight
    
    // Add small random offset within the cell (20% of cell size max)
    const offsetRange = Math.min(cellWidth, cellHeight) * 0.20
    const offsetX = (Math.random() - 0.5) * offsetRange
    const offsetY = (Math.random() - 0.5) * offsetRange
    
    points.push({
      x: cellCenterX + offsetX,
      y: cellCenterY + offsetY
    })
  }
  
  return points
}

// Calculate maximum allowable image size based on grid cell size
// Returns both max width and max height separately to allow overlap
function calculateMaxImageSize(n, bounds, sizeScale, aspectRatio = 'square') {
  const { cols, rows } = calculateGridSize(n, aspectRatio)
  
  // Calculate cell dimensions
  const canvasWidth = bounds.maxX - bounds.minX
  const canvasHeight = bounds.maxY - bounds.minY
  const cellWidth = canvasWidth / cols
  const cellHeight = canvasHeight / rows
  
  // Max width = 1/cols + 10% of cell width (allows overlap)
  // Max height = 1/rows + 10% of cell height (allows overlap)
  const baseMaxWidth = (1 / cols) * canvasWidth
  const baseMaxHeight = (1 / rows) * canvasHeight
  const overlapWidth = cellWidth * 0.10
  const overlapHeight = cellHeight * 0.10
  
  // Apply size scale (slider) to the base size
  const maxWidthMultiplier = 0.85 + (sizeScale * 0.10) // 0.85 to 0.95
  const maxHeightMultiplier = 0.85 + (sizeScale * 0.10) // 0.85 to 0.95
  
  const maxWidth = (baseMaxWidth + overlapWidth) * maxWidthMultiplier
  const maxHeight = (baseMaxHeight + overlapHeight) * maxHeightMultiplier
  
  return {
    maxWidth: Math.max(0.10, Math.min(0.80, maxWidth)),
    maxHeight: Math.max(0.10, Math.min(0.80, maxHeight))
  }
}

// Generate grid-based collage
function generateRandomCollage(images, sizeScale = 0.5, aspectRatio = 'square') {
  if (!images || images.length === 0) return []

  // Shuffle images for randomness
  const shuffled = [...images].sort(() => Math.random() - 0.5)
  const n = shuffled.length

  // Use full canvas with small padding
  const padding = 0.03 // 3% padding
  
  const bounds = {
    minX: padding,
    maxX: 1 - padding,
    minY: padding,
    maxY: 1 - padding
  }
  
  // STEP 1: Create grid-based layout
  const gridPoints = createGridLayout(n, bounds, aspectRatio)
  
  // STEP 2: Calculate maximum allowable image size based on grid cell size
  const { maxWidth: baseMaxWidth, maxHeight: baseMaxHeight } = calculateMaxImageSize(n, bounds, sizeScale, aspectRatio)
  
  // STEP 3: Calculate image sizes with 5-15% variation
  const sizeVariationPercent = 0.05 + (Math.random() * 0.10) // 5% to 15% difference
  const minMultiplier = 1.0 - (sizeVariationPercent / 2)
  const maxMultiplier = 1.0 + (sizeVariationPercent / 2)
  
  const imageWidths = []
  const imageHeights = []
  for (let i = 0; i < n; i++) {
    const randomWidthMultiplier = minMultiplier + Math.random() * (maxMultiplier - minMultiplier)
    const randomHeightMultiplier = minMultiplier + Math.random() * (maxMultiplier - minMultiplier)
    
    const width = baseMaxWidth * randomWidthMultiplier
    const height = baseMaxHeight * randomHeightMultiplier
    
    // Minimum is 75% of max
    imageWidths.push(Math.max(baseMaxWidth * 0.75, Math.min(baseMaxWidth, width)))
    imageHeights.push(Math.max(baseMaxHeight * 0.75, Math.min(baseMaxHeight, height)))
  }
  
  // STEP 4: Create positions from grid points
  const positions = []
  shuffled.forEach((img, idx) => {
    const width = imageWidths[idx]
    const height = imageHeights[idx]
    const rotate = (Math.random() - 0.5) * 8 // -4 to +4 degrees
    
    // Center image at grid point
    const centerX = gridPoints[idx].x
    const centerY = gridPoints[idx].y
    
    positions.push({
      top: (centerY - height / 2) * 100,
      left: (centerX - width / 2) * 100,
      width: width * 100,
      height: height * 100,
      rotate: rotate,
      zIndex: idx + 1,
      image: img,
    })
  })

  return positions
}

// Component for individual collage image with loading state
function CollageImageItem({ item, idx, filter }) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  return (
    <div
      className="absolute overflow-hidden shadow-2xl"
      style={{
        top: `${item.top}%`,
        left: `${item.left}%`,
        width: `${item.width}%`,
        height: `${item.height}%`,
        transform: `rotate(${item.rotate}deg)`,
        zIndex: item.zIndex,
        border: '3px solid rgba(255, 255, 255, 0.95)',
      }}
    >
      <img
        src={item.image}
        alt={`Photo ${idx + 1}`}
        className="w-full h-full object-cover"
        style={{ 
          filter: imageLoaded ? filter.filter : 'none',
          transform: 'scale(1.05)',
          display: imageError ? 'none' : 'block'
        }}
        crossOrigin="anonymous"
        onError={(e) => {
          setImageError(true)
          setImageLoaded(false)
          // Show a placeholder
          const parent = e.target.parentElement
          if (parent) {
            const placeholder = document.createElement('div')
            placeholder.style.cssText = 'display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; color: rgba(255, 255, 255, 0.5); font-size: 10px; font-family: "Courier New", monospace; background: rgba(0, 0, 0, 0.2);'
            placeholder.textContent = 'Image failed to load'
            if (!parent.querySelector('.error-placeholder')) {
              placeholder.className = 'error-placeholder'
              parent.appendChild(placeholder)
            }
          }
        }}
        onLoad={(e) => {
          // Check if image actually loaded (not just a black/empty image)
          const img = e.target
          
          if (img.naturalWidth === 0 || img.naturalHeight === 0) {
            setImageError(true)
            setImageLoaded(false)
            return
          }
          
          setImageLoaded(true)
          setImageError(false)
          img.style.display = 'block'
          img.style.opacity = '1'
          // Remove any error placeholders
          const parent = img.parentElement
          if (parent) {
            const placeholder = parent.querySelector('.error-placeholder')
            if (placeholder) {
              placeholder.remove()
            }
          }
        }}
        loading="eager"
      />
      {imageLoaded && !imageError && filter.shadowOverlay && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 100%, ${filter.shadowOverlay} 0%, transparent 70%)`,
            mixBlendMode: 'multiply',
            opacity: 0.6,
          }}
        />
      )}
      {imageLoaded && !imageError && filter.overlay && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: filter.overlay,
            mixBlendMode: filter.mixBlendMode || 'overlay',
          }}
        />
      )}
    </div>
  )
}

// Format date/time like a digicam timestamp (YYYY/MM/DD HH:MM:SS)
function formatDigicamTimestamp() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`
}

export function CollageCard({ images, year = new Date().getFullYear(), filterStyle = 'fujifilm', sizeScale = 0.5, aspectRatio = 'square', customText = '' }) {
  if (!images || images.length === 0) {
    return (
      <CardTemplate gradientIndex={0} id="card-collage">
        <div className="text-center">
          <h2 className="text-7xl font-display-bold uppercase" style={{ fontFamily: "'Bungee Inline', cursive" }}>
            {customText.toUpperCase() || 'COLLAGE'}
          </h2>
        </div>
      </CardTemplate>
    )
  }

  // Filter out invalid images
  const validImages = images.filter(img => {
    return img && typeof img === 'string' && img.startsWith('data:image/')
  })
  
  if (validImages.length === 0) {
    return (
      <CardTemplate gradientIndex={0} id="card-collage">
        <div className="text-center">
          <h2 className="text-7xl font-display-bold uppercase" style={{ fontFamily: "'Bungee Inline', cursive" }}>
            {customText.toUpperCase() || 'COLLAGE'}
          </h2>
          <p className="mt-4 text-sm opacity-60">No valid images found</p>
        </div>
      </CardTemplate>
    )
  }

  const filter = getFilterStyle(filterStyle)
  const collagePositions = generateRandomCollage(validImages, sizeScale, aspectRatio)
  const timestamp = formatDigicamTimestamp()

  return (
    <CardTemplate gradientIndex={0} id="card-collage">
      <div className="relative w-full h-full p-4">
        {collagePositions.map((item, idx) => (
          <CollageImageItem
            key={idx}
            item={item}
            idx={idx}
            filter={filter}
          />
        ))}
        <div className="absolute bottom-6 right-6" style={{ zIndex: images.length + 10 }}>
          <div className="text-right">
            <div 
              style={{ 
                fontFamily: "'Courier New', monospace",
                fontSize: '12pt',
                color: 'white',
                opacity: 0.9,
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
              }}
            >
              {timestamp}
            </div>
          </div>
        </div>
      </div>
    </CardTemplate>
  )
}

// Keep old card components for backwards compatibility but they won't be used
export function CoverCard({ year = new Date().getFullYear() }) {
  return <CollageCard images={[]} year={year} />
}

export function ArtistCard({ artist }) {
  return null
}

export function SoundtrackCard({ soundtrack }) {
  return null
}

export function ImageGridCard({ images }) {
  return <CollageCard images={images} />
}

export function ImageCollageCard({ images }) {
  return <CollageCard images={images} />
}

export function FinalCard({ artist, soundtrack, year }) {
  return <CollageCard images={[]} year={year} />
}
