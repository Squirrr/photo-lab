import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { prompts, totalPrompts } from '../utils/prompts'
import PromptCard from '../components/PromptCard'
import ProgressIndicator from '../components/ProgressIndicator'
import { saveFormData, loadFormData } from '../lib/storage'

export default function Create() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({})

  useEffect(() => {
    const saved = loadFormData()
    if (saved) {
      setFormData(saved)
      const lastAnsweredStep = prompts.findIndex(
        (p) => !saved[`prompt_${p.id}`]
      )
      if (lastAnsweredStep > 0) {
        setCurrentStep(lastAnsweredStep === -1 ? totalPrompts : lastAnsweredStep)
      }
    }
  }, [])

  const currentPrompt = prompts[currentStep]

  const handleChange = (value) => {
    const newData = {
      ...formData,
      [`prompt_${currentPrompt.id}`]: value,
    }
    setFormData(newData)
    saveFormData(newData)
  }

  const handleSkip = () => {
    handleNext()
  }

  const handleNext = () => {
    if (currentStep < totalPrompts - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      router.push('/gallery')
    }
  }

  if (!currentPrompt) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div style={{ width: '95vw', maxWidth: '95vw' }}>
        <ProgressIndicator currentStep={currentStep + 1} totalSteps={totalPrompts} />
        <PromptCard
          prompt={currentPrompt}
          value={formData[`prompt_${currentPrompt.id}`] || ''}
          onChange={handleChange}
          onSkip={handleSkip}
          onNext={handleNext}
        />
      </div>
    </div>
  )
}

