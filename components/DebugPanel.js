import { useState, useEffect } from 'react'

const debugLogs = []
const maxLogs = 50

export const addDebugLog = (category, message, data = {}) => {
  const log = {
    timestamp: new Date().toLocaleTimeString(),
    category,
    message,
    data: JSON.stringify(data, null, 2),
    id: Date.now() + Math.random()
  }
  debugLogs.unshift(log)
  if (debugLogs.length > maxLogs) {
    debugLogs.pop()
  }
  
  // Also log to console
  console.log(`[${category}]`, message, data)
  
  // Trigger update if component is mounted
  if (window._debugPanelUpdate) {
    window._debugPanelUpdate()
  }
}

export default function DebugPanel() {
  const [logs, setLogs] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(true)

  useEffect(() => {
    // Store update function globally
    window._debugPanelUpdate = () => {
      setLogs([...debugLogs])
    }
    
    // Initial load
    setLogs([...debugLogs])
    
    // Update every second to catch new logs
    const interval = setInterval(() => {
      setLogs([...debugLogs])
    }, 1000)
    
    return () => {
      clearInterval(interval)
      window._debugPanelUpdate = null
    }
  }, [])

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          zIndex: 9999,
          padding: '8px 12px',
          background: 'rgba(212, 165, 116, 0.9)',
          color: '#1a1816',
          border: '2px solid #d4a574',
          borderRadius: '4px',
          fontFamily: "'Courier New', monospace",
          fontSize: '12px',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
        }}
      >
        DEBUG ({logs.length})
      </button>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: isMinimized ? '10px' : '0',
        right: '0',
        width: isMinimized ? '200px' : '95vw',
        maxHeight: isMinimized ? '40px' : '50vh',
        zIndex: 9999,
        background: 'rgba(26, 24, 22, 0.95)',
        border: '2px solid #d4a574',
        borderRadius: '4px',
        fontFamily: "'Courier New', monospace",
        fontSize: '11px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
      }}
    >
      <div
        style={{
          background: 'rgba(212, 165, 116, 0.3)',
          padding: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #d4a574'
        }}
      >
        <div style={{ color: '#d4a574', fontWeight: 'bold' }}>
          DEBUG LOGS ({logs.length})
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            style={{
              padding: '4px 8px',
              background: 'rgba(212, 165, 116, 0.5)',
              border: '1px solid #d4a574',
              color: '#1a1816',
              cursor: 'pointer',
              fontSize: '10px'
            }}
          >
            {isMinimized ? '▼' : '▲'}
          </button>
          <button
            onClick={() => {
              debugLogs.length = 0
              setLogs([])
            }}
            style={{
              padding: '4px 8px',
              background: 'rgba(220, 38, 38, 0.5)',
              border: '1px solid #dc2626',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '10px'
            }}
          >
            CLEAR
          </button>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              padding: '4px 8px',
              background: 'rgba(212, 165, 116, 0.5)',
              border: '1px solid #d4a574',
              color: '#1a1816',
              cursor: 'pointer',
              fontSize: '10px'
            }}
          >
            ×
          </button>
        </div>
      </div>
      
      {!isMinimized && (
        <div
          style={{
            overflowY: 'auto',
            maxHeight: 'calc(50vh - 40px)',
            padding: '8px'
          }}
        >
          {logs.length === 0 ? (
            <div style={{ color: '#c49660', textAlign: 'center', padding: '20px' }}>
              No logs yet...
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                style={{
                  marginBottom: '8px',
                  padding: '8px',
                  background: 'rgba(212, 165, 116, 0.1)',
                  borderLeft: '3px solid #d4a574',
                  borderRadius: '2px'
                }}
              >
                <div style={{ color: '#d4a574', fontSize: '10px', marginBottom: '4px' }}>
                  [{log.category}] {log.timestamp}
                </div>
                <div style={{ color: '#f5f1e8', fontSize: '11px', marginBottom: '4px', wordBreak: 'break-word' }}>
                  {log.message}
                </div>
                {log.data && log.data !== '{}' && (
                  <details style={{ marginTop: '4px' }}>
                    <summary style={{ color: '#c49660', cursor: 'pointer', fontSize: '10px' }}>
                      Details
                    </summary>
                    <pre
                      style={{
                        color: '#c49660',
                        fontSize: '9px',
                        marginTop: '4px',
                        overflow: 'auto',
                        maxHeight: '150px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        padding: '4px',
                        borderRadius: '2px'
                      }}
                    >
                      {log.data}
                    </pre>
                  </details>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

