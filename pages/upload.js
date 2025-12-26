import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import ImageUploader from '../components/ImageUploader'
import { saveImages, loadImages, saveAspectRatio, loadAspectRatio, saveCustomText, loadCustomText } from '../lib/storage'

// Check if a number is a perfect square (valid for square grids)
function isValidSquareCount(n) {
  if (n <= 0) return false
  const sqrt = Math.sqrt(n)
  return Number.isInteger(sqrt) && sqrt <= 9
}

// Calculate what grid size would be used for n images (matching CardPreview logic)
function calculateGridSizeForCount(n, aspectRatio) {
  if (n <= 1) return { cols: 1, rows: 1, capacity: 1 }
  
  if (aspectRatio === 'square') {
    if (n <= 1) return { cols: 1, rows: 1, capacity: 1 }
    if (n <= 4) return { cols: 2, rows: 2, capacity: 4 }
    if (n <= 9) return { cols: 3, rows: 3, capacity: 9 }
    if (n <= 16) return { cols: 4, rows: 4, capacity: 16 }
    if (n <= 25) return { cols: 5, rows: 5, capacity: 25 }
    if (n <= 36) return { cols: 6, rows: 6, capacity: 36 }
    if (n <= 49) return { cols: 7, rows: 7, capacity: 49 }
    if (n <= 64) return { cols: 8, rows: 8, capacity: 64 }
    return { cols: 9, rows: 9, capacity: 81 }
  } else {
    // Portrait grids: 2x3, 3x4, 4x5, etc. (matching CardPreview logic)
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
    
    return { cols, rows, capacity: cols * rows }
  }
}

// Get all valid portrait grid capacities
function getValidPortraitCounts() {
  const validCounts = new Set()
  // Test numbers from 1 to 100 to find all valid portrait grid sizes
  for (let n = 1; n <= 100; n++) {
    const grid = calculateGridSizeForCount(n, 'portrait')
    if (grid.capacity === n) {
      validCounts.add(n)
    }
  }
  return Array.from(validCounts).sort((a, b) => a - b)
}

// Check if a number is valid for portrait grids (exactly matches a grid capacity)
function isValidPortraitCount(n) {
  const grid = calculateGridSizeForCount(n, 'portrait')
  return grid.capacity === n
}

// Check if photo count is valid for the given aspect ratio
function isValidForRatio(count, ratio) {
  if (ratio === 'square') {
    return isValidSquareCount(count)
  } else {
    return isValidPortraitCount(count)
  }
}

export default function Upload() {
  const router = useRouter()
  const [images, setImages] = useState([])
  const [aspectRatio, setAspectRatio] = useState('square')
  const [customText, setCustomText] = useState('')

  useEffect(() => {
    const saved = loadImages()
    const savedAspectRatio = loadAspectRatio()
    const savedCustomText = loadCustomText()
    if (saved && saved.length > 0) {
      setImages(saved)
    }
    if (savedAspectRatio) {
      setAspectRatio(savedAspectRatio)
    }
    if (savedCustomText) {
      setCustomText(savedCustomText)
    }
  }, [])

  const handleImagesChange = (newImages) => {
    setImages(newImages)
    try {
      saveImages(newImages)
    } catch (error) {
      if (error.message?.includes('quota') || error.message?.includes('QuotaExceededError')) {
        // Show alert to user (only once per session to avoid spam)
        if (!window._storageQuotaWarningShown) {
          window._storageQuotaWarningShown = true
          setTimeout(() => {
            alert(
              '⚠️ Storage Limit Reached\n\n' +
              'Your images are too large to save to browser storage.\n\n' +
              'What this means:\n' +
              '• Your images will work in this session\n' +
              '• They won\'t be saved if you refresh the page\n\n' +
              'To fix this:\n' +
              '• Remove some existing images\n' +
              '• Upload fewer images at once\n' +
              '• Images are automatically compressed, but you may have too many'
            )
          }, 500) // Delay to avoid interrupting the upload process
        }
      }
    }
  }

  const handleAspectRatioChange = (ratio) => {
    setAspectRatio(ratio)
    saveAspectRatio(ratio)
  }

  const handleCustomTextChange = (text) => {
    setCustomText(text)
    saveCustomText(text)
  }

  const handleGenerate = () => {
    if (images.length === 0) {
      alert('Please upload at least one image')
      return
    }

    const photoCount = images.length
    const isValidForCurrent = isValidForRatio(photoCount, aspectRatio)
    
    if (!isValidForCurrent) {
      // Check if valid for the other ratio
      const otherRatio = aspectRatio === 'square' ? 'portrait' : 'square'
      const isValidForOther = isValidForRatio(photoCount, otherRatio)
      
      if (isValidForOther) {
        const ratioName = otherRatio === 'square' ? 'Square' : 'Portrait'
        const switchRatio = confirm(
          `Your ${photoCount} photo${photoCount !== 1 ? 's' : ''} ${photoCount !== 1 ? 'are' : 'is'} not valid for ${aspectRatio === 'square' ? 'Square' : 'Portrait'} layout, but ${photoCount !== 1 ? 'are' : 'is'} valid for ${ratioName} layout. Would you like to switch to ${ratioName} layout?`
        )
        
        if (switchRatio) {
          setAspectRatio(otherRatio)
          saveAspectRatio(otherRatio)
          // Wait a moment for state to update, then proceed
          setTimeout(() => {
            router.push('/gallery')
          }, 100)
          return
        } else {
          // User chose not to switch, keep photos and show message
          return
        }
      } else {
        // Not valid for either ratio
        const squareCounts = [1, 4, 9, 16, 25, 36, 49, 64, 81]
        const portraitCounts = getValidPortraitCounts()
        const squareList = squareCounts.join(', ')
        const portraitList = portraitCounts.slice(0, 5).join(', ') + (portraitCounts.length > 5 ? '...' : '')
        
        alert(
          `Your ${photoCount} photo${photoCount !== 1 ? 's' : ''} ${photoCount !== 1 ? 'are' : 'is'} not valid for the selected aspect ratio.\n\n` +
          `Valid counts for Square layout: ${squareList}\n` +
          `Valid counts for Portrait layout: ${portraitList}\n\n` +
          `Please upload a valid number of photos for your selected layout.`
        )
        return
      }
    }
    
    // Valid for current ratio, proceed
    router.push('/gallery')
  }

  // Check if button should be disabled
  const photoCount = images.length
  const isValidForCurrent = isValidForRatio(photoCount, aspectRatio)
  const isButtonDisabled = images.length === 0 || !isValidForCurrent

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative z-10">
      <div style={{ width: '95vw', maxWidth: '95vw' }}>
        <div className="mb-8 text-center">
          <h1 
            className="text-xl md:text-2xl mb-2 font-display-bold uppercase tracking-wider" 
            style={{ letterSpacing: '0.2em', color: '#d4a574', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)' }}
          >
            PHOTO LAB
          </h1>
          <div 
            className="w-20 h-0.5 mx-auto mb-4"
            style={{ background: 'linear-gradient(to right, transparent, #d4a574, transparent)' }}
          />
          <h2 
            className="text-3xl md:text-4xl font-display-bold"
            style={{ color: '#f5f1e8', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)' }}
          >
            DROP YOUR PHOTOS
          </h2>
        </div>
        
        {/* Custom Text Input */}
        <div className="mb-6 retro-grain retro-border p-4">
          <p 
            className="text-center mb-3 text-sm tracking-widest uppercase" 
            style={{ letterSpacing: '0.1em', color: '#d4a574', fontFamily: "'Courier New', monospace" }}
          >
            PERSONALIZE YOUR COLLAGE
          </p>
          <div className="flex flex-col items-center gap-2">
            <label 
              className="text-xs uppercase"
              style={{ color: '#c49660', fontFamily: "'Courier New', monospace" }}
            >
              COLLAGE TITLE
            </label>
            <input
              type="text"
              value={customText}
              onChange={(e) => handleCustomTextChange(e.target.value)}
              placeholder="MEMORIES"
              maxLength={30}
              className="w-full max-w-md px-4 py-2 text-center retro-border"
              style={{
                background: 'rgba(42, 37, 32, 0.8)',
                color: '#f5f1e8',
                fontFamily: "'Courier New', monospace",
                fontSize: '16px',
                borderColor: '#8b7862'
              }}
            />
            <p 
              className="text-xs opacity-60 mt-1"
              style={{ color: '#d4a574', fontFamily: "'Courier New', monospace" }}
            >
              This text will appear on your collage
            </p>
          </div>
        </div>

        {/* Aspect Ratio Selection */}
        <div className="mb-8 retro-grain">
          <p 
            className="text-center mb-4 text-sm tracking-widest uppercase" 
            style={{ letterSpacing: '0.1em', color: '#d4a574', fontFamily: "'Courier New', monospace" }}
          >
            CHOOSE GRID LAYOUT
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => handleAspectRatioChange('square')}
              className={`px-6 py-3 font-medium transition-all retro-border ${
                aspectRatio === 'square'
                  ? ''
                  : 'opacity-60 hover:opacity-80'
              }`}
              style={{
                background: aspectRatio === 'square' 
                  ? 'linear-gradient(to bottom, #d4a574, #c49660)' 
                  : 'rgba(212, 165, 116, 0.2)',
                color: aspectRatio === 'square' ? '#1a1816' : '#d4a574',
                fontFamily: "'Courier New', monospace"
              }}
            >
              SQUARE (1×1, 2×2, 3×3...)
            </button>
            <button
              onClick={() => handleAspectRatioChange('portrait')}
              className={`px-6 py-3 font-medium transition-all retro-border ${
                aspectRatio === 'portrait'
                  ? ''
                  : 'opacity-60 hover:opacity-80'
              }`}
              style={{
                background: aspectRatio === 'portrait' 
                  ? 'linear-gradient(to bottom, #d4a574, #c49660)' 
                  : 'rgba(212, 165, 116, 0.2)',
                color: aspectRatio === 'portrait' ? '#1a1816' : '#d4a574',
                fontFamily: "'Courier New', monospace"
              }}
            >
              PORTRAIT (2×3, 3×4, 4×5...)
            </button>
          </div>
        </div>
        
        <ImageUploader
          images={images}
          onImagesChange={handleImagesChange}
        />
        
        {/* Validation Message */}
        {images.length > 0 && !isValidForCurrent && (
          <div className="mt-2 md:mt-4 text-center">
            <p 
              className="text-sm"
              style={{ 
                color: '#d4a574', 
                fontFamily: "'Courier New', monospace" 
              }}
            >
              {(() => {
                const otherRatio = aspectRatio === 'square' ? 'portrait' : 'square'
                const isValidForOther = isValidForRatio(photoCount, otherRatio)
                const squareCounts = [1, 4, 9, 16, 25, 36, 49, 64, 81]
                const portraitCounts = getValidPortraitCounts()
                
                if (isValidForOther) {
                  const ratioName = otherRatio === 'square' ? 'Square' : 'Portrait'
                  return `Your ${photoCount} photo${photoCount !== 1 ? 's' : ''} ${photoCount !== 1 ? 'are' : 'is'} valid for ${ratioName} layout. Click generate to switch.`
                } else {
                  const validCounts = aspectRatio === 'square' ? squareCounts : portraitCounts
                  const countList = validCounts.slice(0, 5).join(', ') + (validCounts.length > 5 ? '...' : '')
                  return `Invalid photo count for ${aspectRatio === 'square' ? 'Square' : 'Portrait'} layout. Valid counts: ${countList}`
                }
              })()}
            </p>
          </div>
        )}
        
        <div className="flex justify-center mt-4 md:mt-8">
          <button
            onClick={handleGenerate}
            disabled={isButtonDisabled}
            className="px-8 md:px-12 py-3 md:py-4 retro-border font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base hover:scale-105 transform"
            style={{
              background: isButtonDisabled
                ? 'rgba(212, 165, 116, 0.3)' 
                : 'linear-gradient(to bottom, #d4a574, #c49660)',
              color: '#1a1816',
              fontFamily: "'Courier New', monospace",
              boxShadow: !isButtonDisabled ? '0 4px 15px rgba(212, 165, 116, 0.4)' : 'none',
              cursor: isButtonDisabled ? 'not-allowed' : 'pointer'
            }}
          >
            GENERATE COLLAGE
          </button>
        </div>
      </div>
    </div>
  )
}

