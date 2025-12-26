const STORAGE_KEY = 'yearWrapped_data'

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

export const saveImages = (images) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('yearWrapped_images', JSON.stringify(images))
    } catch (error) {
      console.error('Failed to save images:', error)
    }
  }
}

export const loadImages = () => {
  if (typeof window !== 'undefined') {
    try {
      const data = localStorage.getItem('yearWrapped_images')
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Failed to load images:', error)
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

