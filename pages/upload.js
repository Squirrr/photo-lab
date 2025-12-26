import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import ImageUploader from '../components/ImageUploader'
import { saveImages, loadImages, saveAspectRatio, loadAspectRatio } from '../lib/storage'

export default function Upload() {
  const router = useRouter()
  const [images, setImages] = useState([])
  const [aspectRatio, setAspectRatio] = useState('square')

  useEffect(() => {
    const saved = loadImages()
    const savedAspectRatio = loadAspectRatio()
    if (saved && saved.length > 0) {
      setImages(saved)
    }
    if (savedAspectRatio) {
      setAspectRatio(savedAspectRatio)
    }
  }, [])

  const handleImagesChange = (newImages) => {
    setImages(newImages)
    saveImages(newImages)
  }

  const handleAspectRatioChange = (ratio) => {
    setAspectRatio(ratio)
    saveAspectRatio(ratio)
  }

  const handleGenerate = () => {
    if (images.length === 0) {
      alert('Please upload at least one image')
      return
    }
    router.push('/gallery')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative z-10">
      <div className="max-w-2xl w-full">
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
        
        <div className="flex justify-center mt-8">
          <button
            onClick={handleGenerate}
            disabled={images.length === 0}
            className="px-12 py-4 retro-border font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base hover:scale-105 transform"
            style={{
              background: images.length === 0 
                ? 'rgba(212, 165, 116, 0.3)' 
                : 'linear-gradient(to bottom, #d4a574, #c49660)',
              color: '#1a1816',
              fontFamily: "'Courier New', monospace",
              boxShadow: images.length > 0 ? '0 4px 15px rgba(212, 165, 116, 0.4)' : 'none'
            }}
          >
            GENERATE COLLAGE
          </button>
        </div>
      </div>
    </div>
  )
}

