import Link from 'next/link'
import { motion } from 'framer-motion'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center retro-grain"
        style={{ width: '95vw', maxWidth: '95vw' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="retro-border bg-gradient-to-br from-[#2a2520] to-[#1a1816] p-12 md:p-16 vignette"
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-4"
          >
            <h1
              className="text-2xl md:text-3xl mb-2 font-display-bold"
              style={{ color: '#d4a574', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)', letterSpacing: '0.2em' }}
            >
              PHOTO LAB
            </h1>
            <div 
              className="w-24 h-0.5 mx-auto"
              style={{ background: 'linear-gradient(to right, transparent, #d4a574, transparent)' }}
            />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-3xl md:text-5xl mb-6 font-display-bold"
            style={{ color: '#f5f1e8', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)' }}
          >
            CREATE COOL COLLAGES
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-lg md:text-xl mb-3"
            style={{ color: '#d4a574', fontFamily: "'Courier New', monospace" }}
          >
            CREATE STUNNING COLLAGES
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="text-sm md:text-base mb-10"
            style={{ color: '#c49660', fontFamily: "'Courier New', monospace" }}
          >
            UPLOAD YOUR PHOTOS → GET A COOL RETRO COLLAGE
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="flex flex-col items-center gap-4"
          >
            <Link href="/upload">
              <button 
                className="px-10 py-4 font-bold text-base transition-all duration-300 transform hover:scale-105 retro-border"
                style={{ 
                  background: 'linear-gradient(to bottom, #d4a574, #c49660)',
                  color: '#1a1816',
                  fontFamily: "'Courier New', monospace",
                  boxShadow: '0 4px 15px rgba(212, 165, 116, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                }}
              >
                START DEVELOPING
              </button>
            </Link>
            <Link href="/history">
              <button 
                className="text-sm transition-all duration-300 hover:opacity-80"
                style={{ 
                  color: '#c49660',
                  fontFamily: "'Courier New', monospace"
                }}
              >
                VIEW COMMIT HISTORY →
              </button>
            </Link>
          </motion.div>
        </motion.div>
        
        {/* Decorative film strip corners */}
        <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4" style={{ borderColor: '#d4a574' }}></div>
        <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4" style={{ borderColor: '#d4a574' }}></div>
        <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4" style={{ borderColor: '#d4a574' }}></div>
        <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4" style={{ borderColor: '#d4a574' }}></div>
      </motion.div>
    </div>
  )
}

