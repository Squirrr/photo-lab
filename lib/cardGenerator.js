import { CollageCard } from '../components/CardPreview'
import { loadFilter, loadSizeScale, loadAspectRatio } from './storage'

export function generateCards(formData, images = [], filterKey = null) {
  const year = new Date().getFullYear()
  const filterStyle = filterKey || loadFilter() || 'fujifilm'
  const sizeScale = loadSizeScale() || 0.5
  const aspectRatio = loadAspectRatio() || 'square'
  
  // Just generate a single collage card with all images
  const cards = [<CollageCard key={`collage-${filterStyle}`} images={images} year={year} filterStyle={filterStyle} sizeScale={sizeScale} aspectRatio={aspectRatio} />]
  
  return cards
}

