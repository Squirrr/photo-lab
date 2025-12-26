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

  const exportCard = async (filterKey) => {
    try {
      // Use the currently displayed card element
      const element = document.getElementById('card-collage')
      if (!element) {
        console.error(`Card element not found`)
        return
      }

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
            // Wait a bit more for images to render
            await new Promise(resolve => setTimeout(resolve, 800))
            
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

