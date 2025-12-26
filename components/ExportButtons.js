import { useState } from 'react'
import { toPng } from 'html-to-image'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { FILTER_STYLES } from '../utils/filterStyles'

// Use global addDebugLog if available, fallback to console
const addDebugLog = (category, message, data) => {
  if (typeof window !== 'undefined' && window.addDebugLog) {
    window.addDebugLog(category, message, data)
  } else {
    console.log(`[${category}]`, message, data)
  }
}

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

  // Wait for all images in an element to load
  const waitForImages = (element) => {
    return new Promise((resolve) => {
      const images = element.querySelectorAll('img')
      addDebugLog('ExportButtons', 'waitForImages started', {
        imagesCount: images.length,
        elementId: element.id
      })
      
      if (images.length === 0) {
        addDebugLog('ExportButtons', 'No images found, resolving immediately', {})
        resolve()
        return
      }

      let loadedCount = 0
      const totalImages = images.length

      const checkComplete = () => {
        loadedCount++
        addDebugLog('ExportButtons', `Image loaded: ${loadedCount}/${totalImages}`, {
          loadedCount,
          totalImages
        })
        if (loadedCount === totalImages) {
          addDebugLog('ExportButtons', 'All images loaded, waiting 100ms for render', {
            totalImages
          })
          // Give a small delay to ensure rendering is complete
          setTimeout(() => {
            addDebugLog('ExportButtons', 'All images loaded successfully', {})
            resolve()
          }, 100)
        }
      }

      images.forEach((img, idx) => {
        // Remove lazy loading temporarily
        if (img.loading === 'lazy') {
          addDebugLog('ExportButtons', `Removing lazy loading from image ${idx}`, {})
          img.loading = 'eager'
        }

        if (img.complete && img.naturalHeight !== 0) {
          addDebugLog('ExportButtons', `Image ${idx} already complete`, {
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            src: img.src.substring(0, 50) + '...'
          })
          checkComplete()
        } else {
          addDebugLog('ExportButtons', `Waiting for image ${idx} to load`, {
            complete: img.complete,
            naturalHeight: img.naturalHeight,
            src: img.src.substring(0, 50) + '...'
          })
          img.onload = () => {
            addDebugLog('ExportButtons', `Image ${idx} onload fired`, {
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight
            })
            checkComplete()
          }
          img.onerror = () => {
            addDebugLog('ExportButtons', `WARN: Image ${idx} onerror fired`, {
              src: img.src.substring(0, 50) + '...'
            })
            checkComplete() // Count errors as "loaded" to not block
          }
          // Force reload if src is set but image hasn't loaded
          if (img.src && !img.complete) {
            addDebugLog('ExportButtons', `Forcing reload of image ${idx}`, {})
            const src = img.src
            img.src = ''
            img.src = src
          }
        }
      })
      
      // Timeout after 5 seconds
      setTimeout(() => {
        if (loadedCount < totalImages) {
          addDebugLog('ExportButtons', 'WARN: Timeout waiting for images', {
            loadedCount,
            totalImages,
            missing: totalImages - loadedCount
          })
          resolve()
        }
      }, 5000)
    })
  }

  const exportCard = async (filterKey) => {
    addDebugLog('ExportButtons', 'Export card started', { filterKey, isMobile: isMobileDevice() })
    try {
      // Use the currently displayed card element
      const element = document.getElementById('card-collage')
      if (!element) {
        addDebugLog('ExportButtons', 'ERROR: Card element not found', {})
        console.error(`Card element not found`)
        return
      }

      addDebugLog('ExportButtons', 'Card element found, waiting for images', {
        elementId: element.id,
        imagesInElement: element.querySelectorAll('img').length
      })

      // Wait for all images to load before exporting
      await waitForImages(element)
      addDebugLog('ExportButtons', 'All images loaded, proceeding with export', {})
      
      // Additional wait for mobile to ensure rendering
      if (isMobileDevice()) {
        addDebugLog('ExportButtons', 'Mobile device detected, waiting additional 300ms', {})
        await new Promise(resolve => setTimeout(resolve, 300))
      }

      // Try exporting with options that avoid CSS rules access
      addDebugLog('ExportButtons', 'Starting PNG export', {
        pixelRatio: isMobileDevice() ? 1.5 : 2,
        skipFonts: true
      })
      
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
          addDebugLog('ExportButtons', 'WARN: Second export attempt failed', { error: secondError?.message })
          console.warn('Second export attempt failed, trying final fallback:', secondError)
          // Final fallback: absolute minimum options
          addDebugLog('ExportButtons', 'Trying final fallback with minimal options', {})
          dataUrl = await toPng(element, {
            quality: 0.95,
            pixelRatio: 1,
            backgroundColor: '#000000',
            skipFonts: true,
          })
        }
      }

      addDebugLog('ExportButtons', 'PNG export successful', {
        dataUrlLength: dataUrl?.length || 0,
        dataUrlPreview: dataUrl?.substring(0, 100) || 'no data'
      })

      const filterName = FILTER_STYLES[filterKey]?.name || filterKey
      const filename = `photolab-${filterName.toLowerCase().replace(/\s+/g, '-')}.png`
      
      addDebugLog('ExportButtons', 'Preparing download/share', { filename, isMobile: isMobileDevice(), canShare: canUseWebShare() })

      // On mobile, use Web Share API to save to photo library
      if (isMobileDevice() && canUseWebShare()) {
        addDebugLog('ExportButtons', 'Attempting Web Share API', {})
        try {
          // Convert data URL to blob
          const response = await fetch(dataUrl)
          const blob = await response.blob()
          addDebugLog('ExportButtons', 'Data URL converted to blob', {
            blobSize: blob.size,
            blobType: blob.type
          })
          
          const file = new File([blob], filename, { type: 'image/png' })
          addDebugLog('ExportButtons', 'File created for sharing', {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type
          })

          // Use Web Share API - on iOS this allows saving to photo library
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            addDebugLog('ExportButtons', 'Sharing file via Web Share API', {})
            await navigator.share({
              files: [file],
              title: 'Photo Lab Collage',
              text: 'Check out my Photo Lab collage!'
            })
            addDebugLog('ExportButtons', 'Web Share API successful', {})
            return
          } else {
            addDebugLog('ExportButtons', 'Web Share API not available (canShare returned false)', {})
          }
        } catch (shareError) {
          // If share fails, fall through to download
          addDebugLog('ExportButtons', 'WARN: Web Share API failed', { error: shareError?.message })
          console.warn('Web Share API failed, falling back to download:', shareError)
        }
      }

      // Fallback to download for desktop or if share fails
      addDebugLog('ExportButtons', 'Using download fallback', {})
      const link = document.createElement('a')
      link.download = filename
      link.href = dataUrl
      link.click()
      addDebugLog('ExportButtons', 'Download link clicked', { filename })
    } catch (error) {
      addDebugLog('ExportButtons', 'ERROR: Export failed', { error: error?.message, stack: error?.stack })
      console.error('Error exporting card:', error)
      alert('Failed to export card. Please try again.')
    }
  }

  const exportAllCards = async () => {
    addDebugLog('ExportButtons', 'Export all cards started', { allFiltersCount: allFilters.length })
    if (!onExportAllFilters) {
      addDebugLog('ExportButtons', 'ERROR: Export function not available', {})
      alert('Export function not available')
      return
    }
    
    setIsExporting(true)
    try {
      const zip = new JSZip()
      addDebugLog('ExportButtons', 'ZIP created, starting export loop', {})
      
      // Export each filter style
      for (const filterKey of allFilters) {
        addDebugLog('ExportButtons', `Exporting filter: ${filterKey}`, { filterKey, totalFilters: allFilters.length })
        // Change filter and wait for render
        await onExportAllFilters(filterKey, async (element) => {
          if (element) {
            addDebugLog('ExportButtons', `Processing element for ${filterKey}`, {
              imagesCount: element.querySelectorAll('img').length
            })
            // Wait for all images to load
            const images = element.querySelectorAll('img')
            addDebugLog('ExportButtons', `Waiting for ${images.length} images to load`, {})
            await Promise.all(
              Array.from(images).map((img, idx) => {
                return new Promise((resolve) => {
                  if (img.complete && img.naturalHeight !== 0) {
                    addDebugLog('ExportButtons', `Image ${idx} already loaded`, {
                      naturalWidth: img.naturalWidth,
                      naturalHeight: img.naturalHeight
                    })
                    resolve()
                  } else {
                    img.onload = () => {
                      addDebugLog('ExportButtons', `Image ${idx} loaded`, {
                        naturalWidth: img.naturalWidth,
                        naturalHeight: img.naturalHeight
                      })
                      resolve()
                    }
                    img.onerror = () => {
                      addDebugLog('ExportButtons', `WARN: Image ${idx} failed to load`, {})
                      resolve()
                    }
                    // Force reload if needed
                    if (img.src && !img.complete) {
                      addDebugLog('ExportButtons', `Forcing reload of image ${idx}`, {})
                      const src = img.src
                      img.src = ''
                      img.src = src
                    }
                  }
                })
              })
            )
            
            addDebugLog('ExportButtons', 'All images loaded, waiting 500ms for render', {})
            // Wait a bit more for images to render
            await new Promise(resolve => setTimeout(resolve, 500))
            
            addDebugLog('ExportButtons', `Starting PNG export for ${filterKey}`, {
              pixelRatio: isMobileDevice() ? 1.5 : 2
            })
            
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
              addDebugLog('ExportButtons', `PNG export successful for ${filterKey}`, {
                dataUrlLength: dataUrl?.length || 0
              })
            } catch (firstError) {
              addDebugLog('ExportButtons', `WARN: First export attempt failed for ${filterKey}`, { error: firstError?.message })
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
                addDebugLog('ExportButtons', `Fallback export successful for ${filterKey}`, {})
              } catch (secondError) {
                addDebugLog('ExportButtons', `WARN: Second export attempt failed for ${filterKey}`, { error: secondError?.message })
                console.warn('Second export attempt failed, trying final fallback:', secondError)
                dataUrl = await toPng(element, {
                  quality: 0.95,
                  pixelRatio: 1,
                  backgroundColor: '#000000',
                  skipFonts: true,
                })
                addDebugLog('ExportButtons', `Final fallback export successful for ${filterKey}`, {})
              }
            }

            const base64Data = dataUrl.split(',')[1]
            const filterName = FILTER_STYLES[filterKey]?.name || filterKey
            const filename = `photolab-${filterName.toLowerCase().replace(/\s+/g, '-')}.png`
            zip.file(filename, base64Data, { base64: true })
            addDebugLog('ExportButtons', `Added ${filterKey} to ZIP`, { filename, base64Length: base64Data.length })
          }
        })
      }

      addDebugLog('ExportButtons', 'Generating ZIP file', {})
      const blob = await zip.generateAsync({ type: 'blob' })
      addDebugLog('ExportButtons', 'ZIP generated, starting download', {
        zipSize: blob.size,
        zipType: blob.type
      })
      saveAs(blob, 'photolab-all-styles.zip')
      addDebugLog('ExportButtons', 'ZIP download initiated', {})
      
      // Restore original filter
      if (allFilters.length > 0) {
        addDebugLog('ExportButtons', 'Restoring original filter', { originalFilter: currentFilter })
        await onExportAllFilters(currentFilter, async () => {})
      }
      
      addDebugLog('ExportButtons', 'Export all cards completed successfully', {})
    } catch (error) {
      addDebugLog('ExportButtons', 'ERROR: Export all cards failed', { error: error?.message, stack: error?.stack })
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

