import { useState, useRef } from 'react'

export default function ImageUploader({ images, onImagesChange, maxImages = null }) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0, currentFileName: '' })
  const fileInputRef = useRef(null)

  const isHeicFile = (file) => {
    const heicTypes = ['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence']
    return heicTypes.includes(file.type) || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')
  }

  const validateFile = (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence']
    // Also accept files with .heic or .heif extension even if MIME type is not set correctly
    const isValidType = validTypes.includes(file.type) || isHeicFile(file)
    if (!isValidType) {
      alert('Please upload a valid image file (JPG, PNG, WebP, GIF, or HEIC)')
      return false
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size should be less than 10MB')
      return false
    }
    return true
  }

  // Compress image to reduce storage size
  const compressImage = (dataUrl, maxWidth = 1920, maxHeight = 1920, quality = 0.75) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = width * ratio
          height = height * ratio
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        // Convert to JPEG with compression
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedDataUrl)
      }
      img.onerror = reject
      img.src = dataUrl
    })
  }

  const processFile = (file) => {
    return new Promise(async (resolve, reject) => {
      if (!validateFile(file)) {
        reject(new Error('Invalid file'))
        return
      }

      try {
        let dataUrl

        // Convert HEIC files to JPEG
        if (isHeicFile(file)) {
          // Dynamically import heic2any only on client side
          if (typeof window === 'undefined') {
            reject(new Error('HEIC conversion is only available in the browser'))
            return
          }

          try {
            const heic2anyModule = await import('heic2any')
            const heic2any = heic2anyModule.default || heic2anyModule
            
            const convertedBlob = await heic2any({
              blob: file,
              toType: 'image/jpeg',
              quality: 0.92
            })
            // heic2any can return an array if there are multiple images, or a single blob
            const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob
            
            const reader = new FileReader()
            reader.onload = (e) => {
              dataUrl = e.target.result
              // Compress the converted image
              compressImage(dataUrl)
                .then(resolve)
                .catch(() => resolve(dataUrl)) // Fallback to uncompressed if compression fails
            }
            reader.onerror = () => {
              reject(new Error('Failed to read converted HEIC file. The file format may not be supported. Please try converting it to JPEG first.'))
            }
            reader.readAsDataURL(blob)
          } catch (heicError) {
            console.error('HEIC conversion error:', heicError)
            // Provide helpful error message
            const errorMessage = heicError.message?.includes('format not supported') || heicError.code === 2
              ? 'This HEIC file format is not supported. Please convert it to JPEG or PNG first, or try a different HEIC file.'
              : 'Failed to convert HEIC file. Please convert it to JPEG or PNG first.'
            reject(new Error(errorMessage))
          }
        } else {
          // Process regular image files
          const reader = new FileReader()
          reader.onload = async (e) => {
            dataUrl = e.target.result
            // Compress all images to reduce storage size
            try {
              const compressed = await compressImage(dataUrl)
              resolve(compressed)
            } catch (compressError) {
              // If compression fails, use original (but this might cause quota issues)
              console.warn('Image compression failed, using original:', compressError)
              resolve(dataUrl)
            }
          }
          reader.onerror = reject
          reader.readAsDataURL(file)
        }
      } catch (error) {
        console.error('Error processing file:', error)
        reject(error)
      }
    })
  }

  const handleFiles = async (files) => {
    const fileArray = Array.from(files)
    
    // If maxImages is set, enforce limit
    if (maxImages !== null && images.length + fileArray.length > maxImages) {
      const remainingSlots = maxImages - images.length
      alert(`You can only upload ${remainingSlots} more image(s)`)
      return
    }

    setIsProcessing(true)
    setProcessingProgress({ current: 0, total: fileArray.length, currentFileName: fileArray[0]?.name || '' })

    try {
      const successfulImages = []
      const failedFiles = []
      
      // Process files one by one to show progress
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i]
        setProcessingProgress({ 
          current: i, 
          total: fileArray.length, 
          currentFileName: file.name 
        })

        try {
          const result = await processFile(file)
          successfulImages.push(result)
        } catch (error) {
          failedFiles.push(file.name)
          console.error(`Failed to process ${file.name}:`, error)
        }
        
        // Update progress after processing each file
        setProcessingProgress({ 
          current: i + 1, 
          total: fileArray.length, 
          currentFileName: i + 1 < fileArray.length ? fileArray[i + 1]?.name || '' : '' 
        })
      }

      if (successfulImages.length > 0) {
        // Update images - parent component handles storage errors gracefully
        onImagesChange([...images, ...successfulImages])
      }

      if (failedFiles.length > 0) {
        const failedList = failedFiles.length <= 3 
          ? failedFiles.join(', ') 
          : `${failedFiles.slice(0, 3).join(', ')} and ${failedFiles.length - 3} more`
        alert(`Failed to process ${failedFiles.length} file(s): ${failedList}\n\nPlease try converting HEIC files to JPEG/PNG first, or use different image files.`)
      }
    } catch (error) {
      console.error('Error processing images:', error)
      alert('An error occurred while processing images. Please try again.')
    } finally {
      setIsProcessing(false)
      // Reset progress after a brief delay to show completion
      setTimeout(() => {
        setProcessingProgress({ current: 0, total: 0, currentFileName: '' })
      }, 500)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFiles(files)
    }
  }

  const handleFileInput = (e) => {
    const files = e.target.files
    if (files.length > 0) {
      handleFiles(files)
    }
    e.target.value = ''
  }

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed p-8 text-center transition-all retro-border retro-grain ${
          isDragging
            ? ''
            : ''
        } ${maxImages !== null && images.length >= maxImages ? 'opacity-50' : 'cursor-pointer'} ${isProcessing ? 'pointer-events-none' : ''}`}
        style={{
          borderColor: isDragging ? '#d4a574' : '#8b7862',
          background: isDragging 
            ? 'rgba(212, 165, 116, 0.15)' 
            : 'rgba(42, 37, 32, 0.6)',
        }}
        onClick={() => !isProcessing && (maxImages === null || images.length < maxImages) && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          capture="environment"
          onChange={handleFileInput}
          className="hidden"
          disabled={maxImages !== null && images.length >= maxImages || isProcessing}
        />
        <div className="space-y-2">
          <div className="text-4xl mb-2">📸</div>
          {isProcessing ? (
            <>
              <p 
                className="text-lg font-medium"
                style={{ color: '#f5f1e8', fontFamily: "'Courier New', monospace" }}
              >
                PROCESSING FILES...
              </p>
              <p 
                className="text-sm"
                style={{ color: '#d4a574', fontFamily: "'Courier New', monospace" }}
              >
                {processingProgress.current} of {processingProgress.total} processed
              </p>
              {processingProgress.currentFileName && (
                <p 
                  className="text-xs mt-1 truncate max-w-full px-4"
                  style={{ color: '#c49660', fontFamily: "'Courier New', monospace" }}
                >
                  {processingProgress.currentFileName}
                </p>
              )}
              <div 
                className="w-full rounded-full h-2 mt-3"
                style={{ background: 'rgba(212, 165, 116, 0.2)' }}
              >
                <div 
                  className="rounded-full h-2 transition-all duration-300"
                  style={{ 
                    width: `${(processingProgress.current / processingProgress.total) * 100}%`,
                    background: 'linear-gradient(to right, #d4a574, #c49660)'
                  }}
                />
              </div>
            </>
          ) : (
            <>
              <p 
                className="text-lg font-medium"
                style={{ color: '#f5f1e8', fontFamily: "'Courier New', monospace" }}
              >
                DROP YOUR PHOTOS
              </p>
              <p 
                className="text-sm"
                style={{ color: '#d4a574', fontFamily: "'Courier New', monospace" }}
              >
                OR CLICK TO UPLOAD • {images.length} {images.length === 1 ? 'PHOTO' : 'PHOTOS'} UPLOADED
              </p>
            </>
          )}
        </div>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
          {images.map((image, index) => (
            <div key={index} className="relative group retro-border vignette" style={{ borderColor: '#8b7862' }}>
              <img
                src={image}
                alt={`Upload ${index + 1}`}
                className="w-full h-32 object-cover"
                style={{ filter: 'sepia(10%)' }}
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 text-white w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-sm font-bold retro-border"
                style={{
                  background: 'rgba(220, 38, 38, 0.8)',
                  borderColor: '#dc2626',
                  fontFamily: "'Courier New', monospace"
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

