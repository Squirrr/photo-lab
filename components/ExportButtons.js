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

  // Verify an image is actually loaded and rendered
  const verifyImageLoaded = (img, idx) => {
    const isComplete = img.complete
    const hasValidDimensions = img.naturalWidth > 0 && img.naturalHeight > 0
    const isVisible = img.offsetWidth > 0 && img.offsetHeight > 0
    const isInDOM = img.isConnected
    
    addDebugLog('ExportButtons', `Verifying image ${idx}`, {
      complete: isComplete,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      offsetWidth: img.offsetWidth,
      offsetHeight: img.offsetHeight,
      isVisible,
      isInDOM,
      display: window.getComputedStyle(img).display,
      opacity: window.getComputedStyle(img).opacity,
      srcLength: img.src?.length || 0
    })
    
    return isComplete && hasValidDimensions && isVisible && isInDOM
  }

  // Wait for all images in an element to load
  const waitForImages = (element) => {
    return new Promise((resolve) => {
      const images = Array.from(element.querySelectorAll('img'))
      addDebugLog('ExportButtons', 'waitForImages started', {
        imagesCount: images.length,
        elementId: element.id
      })
      
      if (images.length === 0) {
        addDebugLog('ExportButtons', 'No images found, resolving immediately', {})
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
        
        if (verifyImageLoaded(img, idx)) {
          verifiedImages.add(idx)
          verifiedCount++
          addDebugLog('ExportButtons', `Image ${idx} verified: ${verifiedCount}/${totalImages}`, {
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight
          })
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
          addDebugLog('ExportButtons', 'All images verified, waiting 500ms for final render', {
            totalImages
          })
          // Give extra time for rendering, especially on mobile
          setTimeout(() => {
            // Final verification pass
            let finalVerified = 0
            images.forEach((img, idx) => {
              if (verifyImageLoaded(img, idx)) {
                finalVerified++
              }
            })
            
            addDebugLog('ExportButtons', 'Final verification complete', {
              verified: finalVerified,
              total: totalImages
            })
            
            if (finalVerified === totalImages) {
              addDebugLog('ExportButtons', 'All images loaded and verified successfully', {})
            } else {
              addDebugLog('ExportButtons', 'WARN: Some images not fully verified', {
                verified: finalVerified,
                total: totalImages
              })
            }
            
            resolve()
          }, isMobileDevice() ? 1000 : 500)
        } else if (retryCount < maxRetries) {
          retryCount++
          addDebugLog('ExportButtons', `Retry ${retryCount}/${maxRetries} - waiting for images`, {
            verified: verifiedCount,
            total: totalImages
          })
          setTimeout(checkAllComplete, 500)
        } else {
          addDebugLog('ExportButtons', 'WARN: Max retries reached, proceeding with partial load', {
            verified: verifiedCount,
            total: totalImages
          })
          resolve()
        }
      }

      images.forEach((img, idx) => {
        // Remove lazy loading temporarily
        if (img.loading === 'lazy') {
          addDebugLog('ExportButtons', `Removing lazy loading from image ${idx}`, {})
          img.loading = 'eager'
        }

        // Set up load handlers
        const onImageLoad = () => {
          addDebugLog('ExportButtons', `Image ${idx} onload fired`, {
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight
          })
          // Small delay to ensure image is rendered
          setTimeout(() => {
            checkImage(img, idx)
            checkAllComplete()
          }, 100)
        }
        
        const onImageError = () => {
          addDebugLog('ExportButtons', `WARN: Image ${idx} onerror fired`, {
            src: img.src?.substring(0, 50) + '...'
          })
          // Still try to verify - sometimes error fires but image loads
          setTimeout(() => {
            checkImage(img, idx)
            checkAllComplete()
          }, 100)
        }

        if (img.complete && img.naturalHeight !== 0) {
          // Image might already be loaded, but verify it's actually rendered
          addDebugLog('ExportButtons', `Image ${idx} appears complete, verifying`, {
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight
          })
          setTimeout(() => {
            checkImage(img, idx)
            checkAllComplete()
          }, 100)
        } else {
          addDebugLog('ExportButtons', `Setting up load handlers for image ${idx}`, {
            complete: img.complete,
            naturalHeight: img.naturalHeight
          })
          img.onload = onImageLoad
          img.onerror = onImageError
          
          // Force reload if src is set but image hasn't loaded
          if (img.src && !img.complete) {
            addDebugLog('ExportButtons', `Forcing reload of image ${idx}`, {})
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
          addDebugLog('ExportButtons', 'WARN: Safety timeout reached', {
            verified: verifiedCount,
            total: totalImages,
            missing: totalImages - verifiedCount
          })
          resolve()
        }
      }, 10000)
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
      
      // Verify images are still in DOM and visible
      const finalImages = element.querySelectorAll('img')
      let visibleCount = 0
      finalImages.forEach((img, idx) => {
        const isVisible = img.offsetWidth > 0 && img.offsetHeight > 0 && 
                         img.naturalWidth > 0 && img.naturalHeight > 0
        if (isVisible) visibleCount++
        addDebugLog('ExportButtons', `Final check - Image ${idx}`, {
          visible: isVisible,
          offsetWidth: img.offsetWidth,
          offsetHeight: img.offsetHeight,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight
        })
      })
      
      addDebugLog('ExportButtons', 'Pre-export verification complete', {
        visibleImages: visibleCount,
        totalImages: finalImages.length
      })
      
      // Additional wait for mobile to ensure rendering
      if (isMobileDevice()) {
        addDebugLog('ExportButtons', 'Mobile device detected, waiting additional 500ms', {})
        await new Promise(resolve => setTimeout(resolve, 500))
      } else {
        await new Promise(resolve => setTimeout(resolve, 200))
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
            // Wait for all images to load using the robust waitForImages function
            addDebugLog('ExportButtons', `Waiting for images in ${filterKey}`, {
              imagesCount: element.querySelectorAll('img').length
            })
            await waitForImages(element)
            
            // Verify images are visible
            const finalImages = element.querySelectorAll('img')
            let visibleCount = 0
            finalImages.forEach((img, idx) => {
              const isVisible = img.offsetWidth > 0 && img.offsetHeight > 0 && 
                               img.naturalWidth > 0 && img.naturalHeight > 0
              if (isVisible) visibleCount++
            })
            
            addDebugLog('ExportButtons', `Pre-export check for ${filterKey}`, {
              visibleImages: visibleCount,
              totalImages: finalImages.length
            })
            
            // Wait longer for "export all" to ensure each filter's images are fully rendered
            addDebugLog('ExportButtons', `Waiting 1000ms for ${filterKey} to fully render`, {})
            await new Promise(resolve => setTimeout(resolve, isMobileDevice() ? 1500 : 1000))
            
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

