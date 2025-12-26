import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function History() {
  const [commits, setCommits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchCommits = async () => {
      try {
        // Fetch commits from GitHub API
        const response = await fetch('https://api.github.com/repos/Squirrr/photo-lab/commits?per_page=50')
        
        if (!response.ok) {
          throw new Error('Failed to fetch commits')
        }
        
        const data = await response.json()
        setCommits(data)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching commits:', err)
        setError(err.message)
        setLoading(false)
      }
    }

    fetchCommits()
  }, [])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatMessage = (message) => {
    // Split message by newline and take first line
    return message.split('\n')[0]
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8 relative z-10">
      <div style={{ width: '95vw', maxWidth: '95vw' }}>
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/">
            <button
              className="mb-4 text-sm hover:opacity-80 transition-opacity"
              style={{ color: '#d4a574', fontFamily: "'Courier New', monospace" }}
            >
              ← BACK TO HOME
            </button>
          </Link>
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
            className="text-2xl md:text-3xl font-display-bold uppercase tracking-wider" 
            style={{ letterSpacing: '0.1em', color: '#f5f1e8', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)' }}
          >
            COMMIT HISTORY
          </h2>
        </div>

        {/* Content */}
        <div className="retro-border retro-grain" style={{ background: 'rgba(42, 37, 32, 0.6)' }}>
          {loading && (
            <div className="p-8 text-center">
              <p style={{ color: '#d4a574', fontFamily: "'Courier New', monospace" }}>
                LOADING COMMITS...
              </p>
            </div>
          )}

          {error && (
            <div className="p-8 text-center">
              <p style={{ color: '#dc2626', fontFamily: "'Courier New', monospace" }}>
                ERROR: {error}
              </p>
              <p className="mt-4 text-sm" style={{ color: '#c49660', fontFamily: "'Courier New', monospace" }}>
                Unable to fetch commit history. Please try again later.
              </p>
            </div>
          )}

          {!loading && !error && commits.length === 0 && (
            <div className="p-8 text-center">
              <p style={{ color: '#d4a574', fontFamily: "'Courier New', monospace" }}>
                NO COMMITS FOUND
              </p>
            </div>
          )}

          {!loading && !error && commits.length > 0 && (
            <div className="divide-y" style={{ borderColor: '#8b7862' }}>
              {commits.map((commit, index) => (
                <motion.div
                  key={commit.sha}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="p-4 md:p-6 hover:bg-opacity-50 transition-all"
                  style={{ 
                    background: index % 2 === 0 ? 'transparent' : 'rgba(212, 165, 116, 0.05)'
                  }}
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-2">
                        <div 
                          className="text-xs font-mono px-2 py-1 rounded"
                          style={{ 
                            background: 'rgba(212, 165, 116, 0.2)',
                            color: '#d4a574',
                            fontFamily: "'Courier New', monospace"
                          }}
                        >
                          {commit.sha.substring(0, 7)}
                        </div>
                        <p 
                          className="text-sm md:text-base flex-1"
                          style={{ color: '#f5f1e8', fontFamily: "'Courier New', monospace" }}
                        >
                          {formatMessage(commit.commit.message)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-xs" style={{ color: '#c49660', fontFamily: "'Courier New', monospace" }}>
                        <span>
                          {commit.commit.author.name}
                        </span>
                        <span>•</span>
                        <span>
                          {formatDate(commit.commit.author.date)}
                        </span>
                      </div>
                    </div>
                    <a
                      href={commit.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs hover:opacity-80 transition-opacity"
                      style={{ color: '#d4a574', fontFamily: "'Courier New', monospace" }}
                    >
                      VIEW →
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {!loading && !error && commits.length > 0 && (
            <div className="p-4 text-center border-t" style={{ borderColor: '#8b7862' }}>
              <a
                href="https://github.com/Squirrr/photo-lab/commits/main"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm hover:opacity-80 transition-opacity"
                style={{ color: '#d4a574', fontFamily: "'Courier New', monospace" }}
              >
                VIEW ALL COMMITS ON GITHUB →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

