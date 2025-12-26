import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function CardGallery({ cards, onExport, onExportAll, onIndexChange }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)

  const minSwipeDistance = 50

  const onTouchStart = (e) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && currentIndex < cards.length - 1) {
      const newIndex = currentIndex + 1
      setCurrentIndex(newIndex)
      onIndexChange?.(newIndex)
    }
    if (isRightSwipe && currentIndex > 0) {
      const newIndex = currentIndex - 1
      setCurrentIndex(newIndex)
      onIndexChange?.(newIndex)
    }
  }

  const nextCard = () => {
    if (currentIndex < cards.length - 1) {
      const newIndex = currentIndex + 1
      setCurrentIndex(newIndex)
      onIndexChange?.(newIndex)
    }
  }

  const prevCard = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1
      setCurrentIndex(newIndex)
      onIndexChange?.(newIndex)
    }
  }

  useEffect(() => {
    onIndexChange?.(currentIndex)
  }, [currentIndex, onIndexChange])

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="relative">
        <div
          className="overflow-hidden rounded-lg"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
              className="flex justify-center"
            >
              <div className="scale-75 md:scale-100 origin-top">
                {cards[currentIndex]}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {currentIndex > 0 && (
          <button
            onClick={prevCard}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-purple-600 rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition-all"
            aria-label="Previous card"
          >
            ←
          </button>
        )}

        {currentIndex < cards.length - 1 && (
          <button
            onClick={nextCard}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-purple-600 rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition-all"
            aria-label="Next card"
          >
            →
          </button>
        )}
      </div>

      <div className="mt-6 flex justify-center gap-2">
        {cards.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentIndex(index)
              onIndexChange?.(index)
            }}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-white w-8'
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Go to card ${index + 1}`}
          />
        ))}
      </div>

      <div className="mt-8 text-center text-white/80 text-sm">
        Card {currentIndex + 1} of {cards.length}
      </div>
    </div>
  )
}

