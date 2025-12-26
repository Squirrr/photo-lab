import { useState } from 'react'
import { toPng } from 'html-to-image'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { FILTER_STYLES } from '../utils/filterStyles'

// Detect if we're on a mobile device
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (window.innerWidth <= 768)
}

// Check if Web Share API is available
const canUseWebShare = () => {
  return typeof navigator !== 'undefined' && 'share' in navigator
}

export default function ExportButtons({ cardIds = [], currentIndex = 0, currentFilter = 'fujifilm', allFilters = [], onExportAllFilters = null }) {
  const [isExporting, setIsExporting] = useState(false)

  // Verify an image is actually loaded and rendered
  const verifyImageLoaded = (img) => {
    const isComplete = img.complete
    const hasValidDimensions = img.naturalWidth > 0 && img.naturalHeight > 0
    const isVisible = img.offsetWidth > 0 && img.offsetHeight > 0
    const isInDOM = img.isConnected
    
    return isComplete && hasValidDimensions && isVisible && isInDOM
  }

  // Wait for all images in an element to load
  const waitForImages = (element) => {
    return new Promise((resolve) => {
      const images = Array.from(element.querySelectorAll('img'))
      
      if (images.length === 0) {
        resolve()
        return
      }

      let verifiedCount = 0
      const totalImages = images.length
      const verifiedImages = new Set()
      const maxRetries = 3
      let retryCount = 0

      const checkImage = (img, idx) => {
        if (verifiedImages.has(idx)) return true
        
        if (verifyImageLoaded(img)) {
          verifiedImages.add(idx)
          verifiedCount++
          return true
        }
        return false
      }

      const checkAllComplete = () => {
        // Re-check all images
        images.forEach((img, idx) => {
          if (!verifiedImages.has(idx)) {
            checkImage(img, idx)
          }
        })
        
        if (verifiedCount === totalImages) {
          // Give extra time for rendering, especially on mobile
          setTimeout(() => {
            // Final verification pass
            let finalVerified = 0
            images.forEach((img, idx) => {
              if (verifyImageLoaded(img)) {
                finalVerified++
              }
            })
            
            resolve()
          }, isMobileDevice() ? 1000 : 500)
        } else if (retryCount < maxRetries) {
          retryCount++
          setTimeout(checkAllComplete, 500)
        } else {
          resolve()
        }
      }

      images.forEach((img, idx) => {
        // Remove lazy loading temporarily
        if (img.loading === 'lazy') {
          img.loading = 'eager'
        }

        // Set up load handlers
        const onImageLoad = () => {
          // Small delay to ensure image is rendered
          setTimeout(() => {
            checkImage(img, idx)
            checkAllComplete()
          }, 100)
        }
        
        const onImageError = () => {
          // Still try to verify - sometimes error fires but image loads
          setTimeout(() => {
            checkImage(img, idx)
            checkAllComplete()
          }, 100)
        }

        if (img.complete && img.naturalHeight !== 0) {
          // Image might already be loaded, but verify it's actually rendered
          setTimeout(() => {
            checkImage(img, idx)
            checkAllComplete()
          }, 100)
        } else {
          img.onload = onImageLoad
          img.onerror = onImageError
          
          // Force reload if src is set but image hasn't loaded
          if (img.src && !img.complete) {
            const src = img.src
            img.src = ''
            setTimeout(() => {
              img.src = src
            }, 50)
          }
        }
      })
      
      // Initial check
      setTimeout(checkAllComplete, 200)
      
      // Safety timeout after 10 seconds
      setTimeout(() => {
        if (verifiedCount < totalImages) {
          resolve()
        }
      }, 10000)
    })
  }

  const exportCard = async (filterKey) => {
    try {
      // Use the currently displayed card element
      const element = document.getElementById('card-collage')
      if (!element) {
        console.error(`Card element not found`)
        return
      }

      // Wait for all images to load before exporting
      await waitForImages(element)
      
      // Verify images are still in DOM and visible
      const finalImages = element.querySelectorAll('img')
      let visibleCount = 0
      finalImages.forEach((img) => {
        const isVisible = img.offsetWidth > 0 && img.offsetHeight > 0 && 
                         img.naturalWidth > 0 && img.naturalHeight > 0
        if (isVisible) visibleCount++
      })
      
      // Additional wait for mobile to ensure rendering
      if (isMobileDevice()) {
        await new Promise(resolve => setTimeout(resolve, 500))
      } else {
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      // Try exporting with options that avoid CSS rules access
      let dataUrl
      try {
        dataUrl = await toPng(element, {
          quality: 1.0,
          pixelRatio: isMobileDevice() ? 1.5 : 2,
          backgroundColor: '#000000',
          useCORS: true,
          cacheBust: true,
          skipFonts: true, // Skip fonts to avoid CSS rules access
          style: {
            transform: 'scale(1)',
          },
          includeQueryParams: true,
          filter: (node) => {
            // Filter out problematic nodes
            return true
          }
        })
      } catch (firstError) {
        console.warn('First export attempt failed, trying fallback:', firstError)
        try {
          // Fallback: minimal options to avoid CSS rules access
          dataUrl = await toPng(element, {
            quality: 1.0,
            pixelRatio: isMobileDevice() ? 1.5 : 2,
            backgroundColor: '#000000',
            cacheBust: true,
            skipFonts: true,
            includeQueryParams: true,
          })
        } catch (secondError) {
          console.warn('Second export attempt failed, trying final fallback:', secondError)
          // Final fallback: absolute minimum options
          dataUrl = await toPng(element, {
            quality: 0.95,
            pixelRatio: 1,
            backgroundColor: '#000000',
            skipFonts: true,
          })
        }
      }

      const filterName = FILTER_STYLES[filterKey]?.name || filterKey
      const filename = `photolab-${filterName.toLowerCase().replace(/\s+/g, '-')}.png`

      // On mobile, use Web Share API to save to photo library
      if (isMobileDevice() && canUseWebShare()) {
        try {
          // Convert data URL to blob
          const response = await fetch(dataUrl)
          const blob = await response.blob()
          
          const file = new File([blob], filename, { type: 'image/png' })

          // Use Web Share API - on iOS this allows saving to photo library
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'Photo Lab Collage',
              text: 'Check out my Photo Lab collage!'
            })
            return
          }
        } catch (shareError) {
          // If share fails, fall through to download
          console.warn('Web Share API failed, falling back to download:', shareError)
        }
      }

      // Fallback to download for desktop or if share fails
      const link = document.createElement('a')
      link.download = filename
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Error exporting card:', error)
      alert('Failed to export card. Please try again.')
    }
  }

  const exportAllCards = async () => {
    if (!onExportAllFilters) {
      alert('Export function not available')
      return
    }
    
    setIsExporting(true)
    try {
      const zip = new JSZip()
      
      // Export each filter style
      for (const filterKey of allFilters) {
        // Change filter and wait for render
        await onExportAllFilters(filterKey, async (element) => {
          if (element) {
            // Wait for all images to load using the robust waitForImages function
            await waitForImages(element)
            
            // Verify images are visible
            const finalImages = element.querySelectorAll('img')
            let visibleCount = 0
            finalImages.forEach((img) => {
              const isVisible = img.offsetWidth > 0 && img.offsetHeight > 0 && 
                               img.naturalWidth > 0 && img.naturalHeight > 0
              if (isVisible) visibleCount++
            })
            
            // Wait longer for "export all" to ensure each filter's images are fully rendered
            await new Promise(resolve => setTimeout(resolve, isMobileDevice() ? 1500 : 1000))
            
            let dataUrl
            try {
              dataUrl = await toPng(element, {
                quality: 1.0,
                pixelRatio: isMobileDevice() ? 1.5 : 2,
                backgroundColor: '#000000',
                useCORS: true,
                cacheBust: true,
                skipFonts: true, // Skip fonts to avoid CSS rules access
                style: {
                  transform: 'scale(1)',
                },
                includeQueryParams: true,
              })
            } catch (firstError) {
              console.warn('First export attempt failed, trying fallback:', firstError)
              try {
                dataUrl = await toPng(element, {
                  quality: 1.0,
                  pixelRatio: isMobileDevice() ? 1.5 : 2,
                  backgroundColor: '#000000',
                  cacheBust: true,
                  skipFonts: true,
                  includeQueryParams: true,
                })
              } catch (secondError) {
                console.warn('Second export attempt failed, trying final fallback:', secondError)
                dataUrl = await toPng(element, {
                  quality: 0.95,
                  pixelRatio: 1,
                  backgroundColor: '#000000',
                  skipFonts: true,
                })
              }
            }

            const base64Data = dataUrl.split(',')[1]
            const filterName = FILTER_STYLES[filterKey]?.name || filterKey
            const filename = `photolab-${filterName.toLowerCase().replace(/\s+/g, '-')}.png`
            zip.file(filename, base64Data, { base64: true })
          }
        })
      }

      const blob = await zip.generateAsync({ type: 'blob' })
      saveAs(blob, 'photolab-all-styles.zip')
      
      // Restore original filter
      if (allFilters.length > 0) {
        await onExportAllFilters(currentFilter, async () => {})
      }
    } catch (error) {
      console.error('Error exporting all cards:', error)
      alert('Failed to export cards. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const copyCardToClipboard = async (cardId) => {
    try {
      const element = document.getElementById(cardId)
      if (!element) return

      const dataUrl = await toPng(element, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#000000',
        useCORS: true,
        cacheBust: true,
        skipFonts: false,
        style: {
          transform: 'scale(1)',
        },
      }).catch((error) => {
        // Fallback: try without some options if CORS error occurs
        console.warn('First export attempt failed, trying fallback:', error)
        return toPng(element, {
          quality: 1.0,
          pixelRatio: 2,
          backgroundColor: '#000000',
          cacheBust: true,
        })
      })

      const response = await fetch(dataUrl)
      const blob = await response.blob()
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ])
      alert('Card copied to clipboard!')
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      alert('Failed to copy card. Please try downloading instead.')
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
      <button
        onClick={exportAllCards}
        disabled={isExporting}
        className="px-6 py-3 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transform retro-border"
        style={{
          background: isExporting 
            ? 'rgba(212, 165, 116, 0.3)' 
            : 'linear-gradient(to bottom, #d4a574, #c49660)',
          color: '#1a1816',
          fontFamily: "'Courier New', monospace",
          boxShadow: !isExporting ? '0 4px 15px rgba(212, 165, 116, 0.4)' : 'none'
        }}
      >
        {isExporting ? 'EXPORTING...' : 'DOWNLOAD ALL CARDS (ZIP)'}
      </button>
      <button
        onClick={() => exportCard(currentFilter)}
        className="px-6 py-3 font-bold transition-all hover:scale-105 transform retro-border"
        style={{
          background: 'rgba(212, 165, 116, 0.2)',
          color: '#d4a574',
          fontFamily: "'Courier New', monospace"
        }}
      >
        DOWNLOAD CURRENT CARD
      </button>
    </div>
  )
}
