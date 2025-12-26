import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { generateCards } from '../lib/cardGenerator'
import { loadImages, loadSizeScale, saveSizeScale, loadFilter, saveFilter, loadCustomText } from '../lib/storage'
import { FILTER_STYLES } from '../utils/filterStyles'
import CardGallery from '../components/CardGallery'
import ExportButtons from '../components/ExportButtons'
import { CARD_WIDTH, CARD_HEIGHT } from '../components/CardTemplate'

const LOADING_MESSAGES = [
  'Processing...',
  'Building your wrap...',
  'Almost there...',
  'Finalizing...',
]

export default function Gallery() {
  const router = useRouter()
  const [cards, setCards] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sizeScale, setSizeScale] = useState(0.5)
  const [currentFilter, setCurrentFilter] = useState('fujifilm')
  const [cardScale, setCardScale] = useState(1)
  const [customText, setCustomText] = useState('')
  const filterKeys = Object.keys(FILTER_STYLES)

  // Calculate scale for card to fit container
  useEffect(() => {
    const calculateScale = () => {
      if (typeof window === 'undefined') return
      const containerSize = Math.min(window.innerWidth * 0.95, window.innerHeight * 0.95, 1080)
      const scale = containerSize / 1080
      setCardScale(scale)
    }
    
    calculateScale()
    window.addEventListener('resize', calculateScale)
    return () => window.removeEventListener('resize', calculateScale)
  }, [])

  useEffect(() => {
    const images = loadImages()
    const savedScale = loadSizeScale()
    const savedFilter = loadFilter()
    const savedCustomText = loadCustomText()
    
    if (savedScale !== null) {
      setSizeScale(savedScale)
    }
    
    if (savedFilter) {
      setCurrentFilter(savedFilter)
    }

    if (savedCustomText) {
      setCustomText(savedCustomText)
    }

    if (images.length === 0) {
      router.push('/upload')
      return
    }

    const messageInterval = setInterval(() => {
      setLoadingMessage(
        LOADING_MESSAGES[
          Math.floor(Math.random() * LOADING_MESSAGES.length)
        ]
      )
    }, 1500)

    setTimeout(() => {
      updateCards(images, savedFilter || 'fujifilm')
      setIsLoading(false)
      clearInterval(messageInterval)
    }, 1500)
  }, [router])
  
  const updateCards = (images, filterKey) => {
    // Temporarily save the filter so generateCards picks it up
    saveFilter(filterKey)
    const generatedCards = generateCards({}, images, filterKey)
    setCards(generatedCards)
  }

  const handleSizeChange = (newScale) => {
    setSizeScale(newScale)
    saveSizeScale(newScale)
    
    // Regenerate cards with new size
    const images = loadImages()
    const generatedCards = generateCards({}, images)
    setCards(generatedCards)
  }

  const handleRandomize = () => {
    // Regenerate cards with new random layout
    const images = loadImages()
    updateCards(images, currentFilter)
  }
  
  const handleFilterChange = (filterKey) => {
    setCurrentFilter(filterKey)
    saveFilter(filterKey)
    const images = loadImages()
    updateCards(images, filterKey)
  }
  
  const handleNextFilter = () => {
    const currentIndex = filterKeys.indexOf(currentFilter)
    const nextIndex = (currentIndex + 1) % filterKeys.length
    handleFilterChange(filterKeys[nextIndex])
  }
  
  const handlePrevFilter = () => {
    const currentIndex = filterKeys.indexOf(currentFilter)
    const prevIndex = (currentIndex - 1 + filterKeys.length) % filterKeys.length
    handleFilterChange(filterKeys[prevIndex])
  }

  const cardIds = ['card-collage']
  const currentFilterName = FILTER_STYLES[currentFilter]?.name || currentFilter

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center retro-grain"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-t-transparent rounded-full mx-auto mb-4"
            style={{ borderColor: '#d4a574', borderTopColor: 'transparent' }}
          />
          <p 
            className="text-2xl font-bold"
            style={{ color: '#f5f1e8', fontFamily: "'Courier New', monospace", textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)' }}
          >
            {loadingMessage.toUpperCase()}
          </p>
        </motion.div>
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative z-10">
        <div className="text-center">
          <p 
            className="text-2xl mb-4"
            style={{ color: '#f5f1e8', fontFamily: "'Courier New', monospace" }}
          >
            NO CARDS TO DISPLAY
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 font-bold transition-all hover:scale-105 transform retro-border"
            style={{
              background: 'linear-gradient(to bottom, #d4a574, #c49660)',
              color: '#1a1816',
              fontFamily: "'Courier New', monospace"
            }}
          >
            START OVER
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative z-10" style={{ width: '95vw', maxWidth: '95vw' }}>
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
          className="text-3xl md:text-4xl font-display-bold uppercase tracking-wider" 
          style={{ letterSpacing: '0.1em', color: '#f5f1e8', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)' }}
        >
          {customText.toUpperCase() || 'COLLAGE'}
        </h2>
      </div>
      {/* Card gallery with fixed size container matching card dimensions for screenshots */}
      <div 
        className="mx-auto"
        style={{
          width: 'min(95vw, 95vh)',
          height: 'min(95vw, 95vh)',
          maxWidth: '1080px',
          maxHeight: '1080px',
          aspectRatio: '1 / 1',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            width: '1080px',
            height: '1080px',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${cardScale})`,
            transformOrigin: 'center center'
          }}
        >
          <CardGallery cards={cards} onIndexChange={setCurrentIndex} />
        </div>
      </div>
      
      {/* Filter Controls */}
      <div className="mt-8 text-center">
        <p 
          className="text-sm mb-3"
          style={{ color: '#d4a574', fontFamily: "'Courier New', monospace" }}
        >
          FILM STYLE: {currentFilterName.toUpperCase()}
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handlePrevFilter}
            className="px-4 py-2 retro-border font-medium transition-all hover:scale-105 transform"
            style={{
              background: 'rgba(212, 165, 116, 0.2)',
              color: '#d4a574',
              fontFamily: "'Courier New', monospace"
            }}
          >
            ← PREV
          </button>
          <button
            onClick={handleNextFilter}
            className="px-4 py-2 retro-border font-medium transition-all hover:scale-105 transform"
            style={{
              background: 'rgba(212, 165, 116, 0.2)',
              color: '#d4a574',
              fontFamily: "'Courier New', monospace"
            }}
          >
            NEXT →
          </button>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
        <button
          onClick={handleRandomize}
          className="px-6 py-3 retro-border font-medium transition-all hover:scale-105 transform"
          style={{
            background: 'linear-gradient(to bottom, #d4a574, #c49660)',
            color: '#1a1816',
            fontFamily: "'Courier New', monospace",
            boxShadow: '0 4px 15px rgba(212, 165, 116, 0.4)'
          }}
        >
          RANDOMIZE LAYOUT
        </button>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 retro-border font-medium transition-all hover:scale-105 transform"
          style={{
            background: 'rgba(212, 165, 116, 0.2)',
            color: '#d4a574',
            fontFamily: "'Courier New', monospace"
          }}
        >
          CREATE ANOTHER
        </button>
      </div>
      
      <ExportButtons 
        cardIds={cardIds} 
        currentIndex={currentIndex}
        currentFilter={currentFilter}
        allFilters={filterKeys}
        onExportAllFilters={async (filterKey, callback) => {
          // Temporarily change filter, wait for render, then export
          const originalFilter = currentFilter
          if (filterKey !== currentFilter) {
            handleFilterChange(filterKey)
            
            // Wait longer for DOM to update and images to re-render
            const waitTime = typeof window !== 'undefined' && window.innerWidth <= 768 ? 1500 : 1000
            await new Promise(resolve => setTimeout(resolve, waitTime))
            
            // Wait for the element to exist and images to be in DOM
            let element = document.getElementById('card-collage')
            let retries = 0
            while (!element && retries < 10) {
              await new Promise(resolve => setTimeout(resolve, 100))
              element = document.getElementById('card-collage')
              retries++
            }
            
            if (element) {
              const images = element.querySelectorAll('img')
              
              // Wait for images to actually load
              await new Promise(resolve => {
                let loadedCount = 0
                const totalImages = images.length
                
                if (totalImages === 0) {
                  resolve()
                  return
                }
                
                const checkComplete = () => {
                  loadedCount++
                  if (loadedCount === totalImages) {
                    resolve()
                  }
                }
                
                images.forEach((img) => {
                  if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
                    checkComplete()
                  } else {
                    img.onload = checkComplete
                    img.onerror = checkComplete
                  }
                })
                
                // Safety timeout
                setTimeout(() => {
                  if (loadedCount < totalImages) {
                    resolve()
                  }
                }, 5000)
              })
              
              // Additional wait for rendering
              await new Promise(resolve => setTimeout(resolve, 500))
            }
          }
          
          const element = document.getElementById('card-collage')
          await callback(element)
          
          // Restore original filter
          if (filterKey !== originalFilter) {
            handleFilterChange(originalFilter)
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        }}
      />
    </div>
  )
}

