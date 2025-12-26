import { FILTER_STYLES } from '../utils/filterStyles'

export default function FilterSelector({ selectedFilter, onFilterChange }) {
  const filters = Object.entries(FILTER_STYLES)

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 retro-grain">
      <div className="text-center mb-8">
        <h3 
          className="text-2xl mb-2 font-display-bold"
          style={{ color: '#f5f1e8', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)' }}
        >
          CHOOSE FILM STYLE
        </h3>
        <p 
          className="text-sm tracking-widest uppercase" 
          style={{ letterSpacing: '0.1em', color: '#d4a574', fontFamily: "'Courier New', monospace" }}
        >
          SELECT COLOR GRADE
        </p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filters.map(([key, style]) => (
          <button
            key={key}
            onClick={() => onFilterChange(key)}
            className={`p-4 border-2 transition-all text-left retro-border hover:scale-105 transform ${
              selectedFilter === key
                ? ''
                : 'opacity-70'
            }`}
            style={{
              background: selectedFilter === key
                ? 'rgba(212, 165, 116, 0.2)'
                : 'rgba(42, 37, 32, 0.6)',
              borderColor: selectedFilter === key ? '#d4a574' : '#8b7862'
            }}
          >
            <div 
              className="font-bold mb-1 text-sm"
              style={{ 
                color: selectedFilter === key ? '#f5f1e8' : '#d4a574',
                fontFamily: "'Courier New', monospace"
              }}
            >
              {style.name.toUpperCase()}
            </div>
            <div 
              className="text-xs"
              style={{ 
                color: selectedFilter === key ? '#d4a574' : '#c49660',
                fontFamily: "'Courier New', monospace"
              }}
            >
              {style.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

