export default function ProgressIndicator({ currentStep, totalSteps }) {
  const progress = (currentStep / totalSteps) * 100

  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-white/80 text-sm">
          {currentStep} of {totalSteps}
        </span>
        <span className="text-white/80 text-sm">{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
        <div
          className="bg-white h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

