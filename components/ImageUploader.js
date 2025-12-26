import { useState, useRef } from 'react'

// Use global addDebugLog if available, fallback to console
const addDebugLog = (category, message, data) => {
  if (typeof window !== 'undefined' && window.addDebugLog) {
    window.addDebugLog(category, message, data)
  } else {
    console.log(`[${category}]`, message, data)
  }
}

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

  // Detect if we're on a mobile device
  const isMobileDevice = () => {
    if (typeof window === 'undefined') return false
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768)
  }

  // Compress image to reduce storage size
  // Use more aggressive compression on mobile to save memory
  const compressImage = (dataUrl) => {
    return new Promise((resolve, reject) => {
      const mobile = isMobileDevice()
      // More aggressive compression on mobile: smaller size, lower quality
      const maxWidth = mobile ? 1600 : 1920
      const maxHeight = mobile ? 1600 : 1920
      const quality = mobile ? 0.65 : 0.75
      
      addDebugLog('ImageUploader', 'Starting image compression', {
        mobile,
        maxWidth,
        maxHeight,
        quality,
        inputLength: dataUrl.length,
        inputPreview: dataUrl.substring(0, 100)
      })
      
      const img = new Image()
      img.onload = () => {
        try {
          addDebugLog('ImageUploader', 'Image loaded for compression', {
            originalWidth: img.width,
            originalHeight: img.height,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight
          })
          
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          // Calculate new dimensions while maintaining aspect ratio
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height)
            width = width * ratio
            height = height * ratio
            addDebugLog('ImageUploader', 'Resizing image', {
              original: `${img.width}x${img.height}`,
              new: `${width}x${height}`,
              ratio
            })
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)

          // Convert to JPEG with compression
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
          
          addDebugLog('ImageUploader', 'Image compression complete', {
            originalLength: dataUrl.length,
            compressedLength: compressedDataUrl.length,
            compressionRatio: ((1 - compressedDataUrl.length / dataUrl.length) * 100).toFixed(2) + '%',
            finalDimensions: `${width}x${height}`
          })
          
          // Clean up to free memory
          img.src = ''
          canvas.width = 0
          canvas.height = 0
          
          resolve(compressedDataUrl)
        } catch (error) {
          addDebugLog('ImageUploader', 'ERROR: Compression error', { error: error?.message })
          reject(error)
        }
      }
      img.onerror = (error) => {
        addDebugLog('ImageUploader', 'ERROR: Image load error during compression', { error: error?.message })
        reject(error)
      }
      img.src = dataUrl
    })
  }

  const processFile = (file) => {
    return new Promise(async (resolve, reject) => {
      addDebugLog('ImageUploader', 'Processing file', {
        name: file.name,
        type: file.type,
        size: file.size,
        isHeic: isHeicFile(file),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        isMobile: isMobileDevice()
      })
      
      if (!validateFile(file)) {
        addDebugLog('ImageUploader', 'ERROR: File validation failed', { name: file.name, type: file.type })
        reject(new Error('Invalid file'))
        return
      }

      try {
        let dataUrl

        // Convert HEIC files to JPEG
        if (isHeicFile(file)) {
          addDebugLog('ImageUploader', 'Processing HEIC file', { name: file.name })
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
              addDebugLog('ImageUploader', 'HEIC converted to data URL', {
                name: file.name,
                dataUrlLength: dataUrl.length,
                dataUrlPreview: dataUrl.substring(0, 100),
                mimeType: dataUrl.split(';')[0]
              })
              // Compress the converted image
              compressImage(dataUrl)
                .then((compressed) => {
                  addDebugLog('ImageUploader', 'HEIC image compressed', {
                    name: file.name,
                    originalLength: dataUrl.length,
                    compressedLength: compressed.length,
                    compressionRatio: ((1 - compressed.length / dataUrl.length) * 100).toFixed(2) + '%'
                  })
                  resolve(compressed)
                })
                .catch((error) => {
                  addDebugLog('ImageUploader', 'WARN: HEIC compression failed', { name: file.name, error: error?.message })
                  resolve(dataUrl) // Fallback to uncompressed if compression fails
                })
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
          addDebugLog('ImageUploader', 'Processing regular image file', { name: file.name, type: file.type })
          const reader = new FileReader()
          reader.onload = async (e) => {
            dataUrl = e.target.result
            addDebugLog('ImageUploader', 'File read as data URL', {
              name: file.name,
              dataUrlLength: dataUrl.length,
              dataUrlPreview: dataUrl.substring(0, 100),
              mimeType: dataUrl.split(';')[0]
            })
            // Compress all images to reduce storage size
            try {
              const compressed = await compressImage(dataUrl)
              addDebugLog('ImageUploader', 'Image compressed', {
                name: file.name,
                originalLength: dataUrl.length,
                compressedLength: compressed.length,
                compressionRatio: ((1 - compressed.length / dataUrl.length) * 100).toFixed(2) + '%'
              })
              resolve(compressed)
            } catch (compressError) {
              // If compression fails, use original (but this might cause quota issues)
              addDebugLog('ImageUploader', 'WARN: Image compression failed', { name: file.name, error: compressError?.message })
              resolve(dataUrl)
            }
          }
          reader.onerror = (error) => {
            addDebugLog('ImageUploader', 'ERROR: FileReader error', { name: file.name, error: error?.message })
            reject(error)
          }
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
      
      // On mobile, process in smaller batches to avoid memory issues
      const mobile = isMobileDevice()
      const batchSize = mobile ? 3 : 5
      const totalBatches = Math.ceil(fileArray.length / batchSize)
      
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const batchStart = batchIndex * batchSize
        const batchEnd = Math.min(batchStart + batchSize, fileArray.length)
        const batch = fileArray.slice(batchStart, batchEnd)
        
        // Process batch
        for (let i = 0; i < batch.length; i++) {
          const fileIndex = batchStart + i
          const file = batch[i]
          
          setProcessingProgress({ 
            current: fileIndex, 
            total: fileArray.length, 
            currentFileName: file.name 
          })

          try {
            // Add timeout for mobile to prevent hanging
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Processing timeout')), mobile ? 30000 : 60000)
            )
            
            const result = await Promise.race([
              processFile(file),
              timeoutPromise
            ])
            
            addDebugLog('ImageUploader', 'File processed successfully', {
              fileName: file.name,
              resultLength: result?.length || 0,
              resultPreview: result?.substring(0, 100) || 'no result',
              isDataUrl: typeof result === 'string' && result.startsWith('data:image/')
            })
            
            successfulImages.push(result)
            
            // Update state incrementally on mobile to avoid memory buildup
            if (mobile && successfulImages.length > 0) {
              // Update every 2 images on mobile to reduce memory pressure
              if (successfulImages.length % 2 === 0 || fileIndex === fileArray.length - 1) {
                try {
                  onImagesChange([...images, ...successfulImages])
                } catch (error) {
                  // If storage fails, continue processing but log it
                  console.warn('Failed to save batch, continuing...', error)
                }
              }
            }
          } catch (error) {
            failedFiles.push(file.name)
            console.error(`Failed to process ${file.name}:`, error)
            
            // On mobile, if we get memory errors, suggest reducing batch
            if (mobile && (error.message?.includes('memory') || error.message?.includes('timeout'))) {
              console.warn('Mobile memory issue detected, consider uploading fewer images at once')
            }
          }
          
          // Update progress
          setProcessingProgress({ 
            current: fileIndex + 1, 
            total: fileArray.length, 
            currentFileName: fileIndex + 1 < fileArray.length ? fileArray[fileIndex + 1]?.name || '' : '' 
          })
          
          // Small delay between files on mobile to allow memory cleanup
          if (mobile && i < batch.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100))
          }
        }
        
        // Update state after each batch completes (for non-mobile or final batch)
        if (!mobile && successfulImages.length > 0) {
          try {
            onImagesChange([...images, ...successfulImages])
          } catch (error) {
            console.warn('Failed to save batch, continuing...', error)
          }
        }
        
        // Delay between batches on mobile to allow memory recovery
        if (mobile && batchIndex < totalBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }

      // Final update with all successful images (in case incremental updates missed some)
      if (successfulImages.length > 0) {
        addDebugLog('ImageUploader', 'Final update with all successful images', {
          successfulCount: successfulImages.length,
          totalImages: images.length + successfulImages.length,
          successfulImages: successfulImages.map((img, idx) => ({
            index: idx,
            type: typeof img,
            isString: typeof img === 'string',
            startsWithData: typeof img === 'string' ? img.startsWith('data:image/') : false,
            length: typeof img === 'string' ? img.length : 0,
            preview: typeof img === 'string' ? img.substring(0, 80) : 'not a string'
          }))
        })
        try {
          onImagesChange([...images, ...successfulImages])
          addDebugLog('ImageUploader', 'Final images update successful', {})
        } catch (error) {
          // If final update fails, at least show what we have
          addDebugLog('ImageUploader', 'ERROR: Failed to save final images', { error: error?.message })
        }
      }

      if (failedFiles.length > 0) {
        const failedList = failedFiles.length <= 3 
          ? failedFiles.join(', ') 
          : `${failedFiles.slice(0, 3).join(', ')} and ${failedFiles.length - 3} more`
        alert(`Failed to process ${failedFiles.length} file(s): ${failedList}\n\nPlease try converting HEIC files to JPEG/PNG first, or use different image files.`)
      }
      
      // Show success message if many images were processed
      if (successfulImages.length > 10) {
        console.log(`Successfully processed ${successfulImages.length} images`)
      }
    } catch (error) {
      console.error('Error processing images:', error)
      alert('An error occurred while processing images. Please try uploading fewer images at once, especially on mobile devices.')
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
    <div className="w-full max-w-2xl mx-auto space-y-3 md:space-y-6">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed p-6 md:p-8 text-center transition-all retro-border retro-grain ${
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
                TAP TO UPLOAD FROM LIBRARY • {images.length} {images.length === 1 ? 'PHOTO' : 'PHOTOS'} UPLOADED
              </p>
            </>
          )}
        </div>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mt-3 md:mt-6">
          {images.map((image, index) => (
            <div key={index} className="relative group retro-border vignette" style={{ borderColor: '#8b7862' }}>
              <img
                src={image}
                alt={`Upload ${index + 1}`}
                className="w-full h-32 object-cover"
                style={{ filter: 'sepia(10%)' }}
                onError={(e) => {
                  console.error(`Failed to load image ${index + 1}`)
                  e.target.style.display = 'none'
                }}
                loading="lazy"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 text-white w-6 h-6 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-sm font-bold retro-border"
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

