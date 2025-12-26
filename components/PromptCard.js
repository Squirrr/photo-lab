import { useState, useEffect } from 'react'

const EMOJI_OPTIONS = ['😊', '😎', '🤔', '🔥', '✨', '💯', '🎉', '😌', '🤡', '💅', '😵', '🙃', '🥳', '😴', '🫠']

export default function PromptCard({ prompt, value, onChange, onSkip, onNext }) {
  const [localValue, setLocalValue] = useState(value || '')

  useEffect(() => {
    setLocalValue(value || '')
  }, [value, prompt.id])

  const handleChange = (newValue) => {
    setLocalValue(newValue)
    onChange(newValue)
  }

  const handleEmojiClick = (emoji) => {
    const currentText = localValue || ''
    // Count only emojis from the grid selection (not typed ones)
    const gridEmojis = EMOJI_OPTIONS.filter(e => currentText.includes(e))
    
    if (currentText.includes(emoji)) {
      // Remove the emoji
      const updated = currentText.replace(emoji, '')
      handleChange(updated)
    } else if (gridEmojis.length < (prompt.maxEmojis || 2)) {
      // Add the emoji if we haven't reached max grid selections
      handleChange(currentText + emoji)
    }
  }

  const renderInput = () => {
    switch (prompt.type) {
      case 'text':
        return (
          <input
            type="text"
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={prompt.placeholder}
            maxLength={prompt.maxLength}
            className="w-full px-4 py-3 rounded-lg bg-white/90 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white text-lg"
          />
        )
      case 'emoji':
        const selectedCount = localValue ? Array.from(localValue).filter((char) => /\p{Emoji}/u.test(char)).length : 0
        const canSelectMore = selectedCount < (prompt.maxEmojis || 2)
        const canTypeMore = selectedCount < (prompt.maxTypedEmojis || 3)
        
        return (
          <div className="space-y-4">
            <div className="bg-white/20 rounded-lg p-4 min-h-[60px] flex items-center justify-center">
              <span className="text-4xl">{localValue || 'Pick 2 or type 3'}</span>
            </div>
            <input
              type="text"
              value={localValue}
              onChange={(e) => {
                const input = e.target.value
                // Count emojis only
                const emojiCount = Array.from(input).filter((char) => /\p{Emoji}/u.test(char)).length
                if (emojiCount <= (prompt.maxTypedEmojis || 3)) {
                  handleChange(input)
                }
              }}
              placeholder="Type up to 3 emojis"
              className="w-full px-4 py-3 rounded-lg bg-white/90 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white text-lg mb-4"
            />
            <p className="text-white/70 text-sm text-center mb-2">Or pick from grid (max {prompt.maxEmojis || 2}):</p>
            <div className="grid grid-cols-5 gap-3">
              {EMOJI_OPTIONS.map((emoji) => {
                const isSelected = localValue && localValue.includes(emoji)
                return (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiClick(emoji)}
                    disabled={!canSelectMore && !isSelected}
                    className={`text-3xl p-3 rounded-lg transition-all ${
                      isSelected
                        ? 'bg-white scale-110'
                        : canSelectMore
                        ? 'bg-white/20 hover:bg-white/40'
                        : 'bg-white/10 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    {emoji}
                  </button>
                )
              })}
            </div>
          </div>
        )
      case 'radio':
        return (
          <div className="space-y-3">
            {prompt.options.map((option) => (
              <label
                key={option.value}
                className={`block p-4 rounded-lg cursor-pointer transition-all ${
                  localValue === option.value
                    ? 'bg-white text-purple-600'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <input
                  type="radio"
                  name={`prompt-${prompt.id}`}
                  value={option.value}
                  checked={localValue === option.value}
                  onChange={(e) => handleChange(e.target.value)}
                  className="sr-only"
                />
                <span className="text-lg">{option.label}</span>
              </label>
            ))}
          </div>
        )
      case 'dropdown':
        return (
          <select
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/90 text-gray-800 focus:outline-none focus:ring-2 focus:ring-white text-lg"
          >
            <option value="">Select one...</option>
            {prompt.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )
      default:
        return null
    }
  }

  return (
    <div className="max-w-md w-full mx-auto">
      <h2 className="text-3xl md:text-4xl text-white mb-8 text-center drop-shadow-lg font-display-bold">
        {prompt.question}
      </h2>
      <div className="mb-6">{renderInput()}</div>
      <div className="flex gap-3">
        <button
          onClick={onSkip}
          className="flex-1 py-3 px-4 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-all font-medium"
        >
          Skip
        </button>
        <button
          onClick={onNext}
          className="flex-1 py-3 px-4 rounded-lg bg-white text-purple-600 hover:bg-white/90 transition-all font-bold"
        >
          Next
        </button>
      </div>
    </div>
  )
}

