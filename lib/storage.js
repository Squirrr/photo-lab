const STORAGE_KEY = 'yearWrapped_data'

// Debug logging function (will be available if DebugPanel is loaded)
const debugLog = (category, message, data) => {
  if (typeof window !== 'undefined' && window.addDebugLog) {
    window.addDebugLog(category, message, data)
  } else {
    console.log(`[${category}]`, message, data)
  }
}

export const saveFormData = (data) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  }
}

export const loadFormData = () => {
  if (typeof window !== 'undefined') {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Failed to load from localStorage:', error)
      return null
    }
  }
  return null
}

export const clearFormData = () => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear localStorage:', error)
    }
  }
}

// Estimate the size of data in bytes
const estimateSize = (data) => {
  if (typeof data === 'string') {
    return new Blob([data]).size
  }
  return new Blob([JSON.stringify(data)]).size
}

// Get available localStorage space (approximate)
const getAvailableSpace = () => {
  try {
    // Most browsers have ~5-10MB limit, but it varies
    // We'll use a conservative estimate of 4MB
    const testKey = '__storage_test__'
    const testValue = 'x'.repeat(1024 * 1024) // 1MB test
    let available = 0
    
    try {
      localStorage.setItem(testKey, testValue)
      localStorage.removeItem(testKey)
      // If that worked, we have at least 1MB
      available = 4 * 1024 * 1024 // Assume 4MB available
    } catch (e) {
      // Storage is full or very limited
      available = 0
    }
    
    return available
  } catch (e) {
    return 0
  }
}

export const saveImages = (images) => {
  if (typeof window !== 'undefined') {
    try {
      const imagesJson = JSON.stringify(images)
      const size = estimateSize(imagesJson)
      const available = getAvailableSpace()
      
      // Check if we're approaching the limit (use 90% of estimated available space)
      if (available > 0 && size > available * 0.9) {
        console.warn('Image data is large and may exceed storage quota. Consider removing some images.')
        // Try to save anyway, but warn the user if it fails
      }
      
      localStorage.setItem('yearWrapped_images', imagesJson)
    } catch (error) {
      console.error('Failed to save images:', error)
      
      // Provide helpful error message for quota exceeded
      if (error.name === 'QuotaExceededError' || error.code === 22) {
        const errorMessage = 'Storage quota exceeded. Please remove some images and try again, or use fewer/lower quality images.'
        console.error(errorMessage)
        // Return error so caller can handle it
        throw new Error(errorMessage)
      }
      
      throw error
    }
  }
}

export const loadImages = () => {
  if (typeof window !== 'undefined') {
    try {
      const data = localStorage.getItem('yearWrapped_images')
      debugLog('Storage', 'Loading images from localStorage', {
        hasData: !!data,
        dataLength: data?.length || 0,
        dataPreview: data?.substring(0, 200) || 'no data'
      })
      
      if (!data) {
        debugLog('Storage', 'No images found in localStorage', {})
        return []
      }
      
      const images = JSON.parse(data)
      debugLog('Storage', 'Parsed images from JSON', {
        count: images.length,
        images: images.map((img, idx) => ({
          index: idx,
          type: typeof img,
          isString: typeof img === 'string',
          startsWithData: typeof img === 'string' ? img.startsWith('data:image/') : false,
          length: typeof img === 'string' ? img.length : 0,
          preview: typeof img === 'string' ? img.substring(0, 80) : 'not a string'
        }))
      })
      
      // Validate that images are valid data URLs
      const validImages = images.filter(img => {
        const isValid = img && typeof img === 'string' && img.startsWith('data:image/')
        if (!isValid) {
          debugLog('Storage', 'WARN: Invalid image filtered out', {
            type: typeof img,
            isString: typeof img === 'string',
            startsWithData: typeof img === 'string' ? img.startsWith('data:image/') : false,
            preview: typeof img === 'string' ? img.substring(0, 50) : img
          })
        }
        return isValid
      })
      
      debugLog('Storage', 'Image validation complete', {
        total: images.length,
        valid: validImages.length,
        invalid: images.length - validImages.length
      })
      
      return validImages
    } catch (error) {
      console.error('[Storage] Failed to load images:', error)
      return []
    }
  }
  return []
}

export const saveFilter = (filterKey) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('yearWrapped_filter', filterKey)
    } catch (error) {
      console.error('Failed to save filter:', error)
    }
  }
}

export const loadFilter = () => {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem('yearWrapped_filter') || 'fujifilm'
    } catch (error) {
      console.error('Failed to load filter:', error)
      return 'fujifilm'
    }
  }
  return 'fujifilm'
}

export const saveSizeScale = (scale) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('yearWrapped_sizeScale', scale.toString())
    } catch (error) {
      console.error('Failed to save size scale:', error)
    }
  }
}

export const loadSizeScale = () => {
  if (typeof window !== 'undefined') {
    try {
      const scale = localStorage.getItem('yearWrapped_sizeScale')
      return scale ? parseFloat(scale) : 0.5 // Default to 50% (middle of 0-1 range)
    } catch (error) {
      console.error('Failed to load size scale:', error)
      return 0.5
    }
  }
  return 0.5
}

export const saveAspectRatio = (aspectRatio) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('yearWrapped_aspectRatio', aspectRatio)
    } catch (error) {
      console.error('Failed to save aspect ratio:', error)
    }
  }
}

export const loadAspectRatio = () => {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem('yearWrapped_aspectRatio') || 'square' // Default to square
    } catch (error) {
      console.error('Failed to load aspect ratio:', error)
      return 'square'
    }
  }
  return 'square'
}

