interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2 mb-8">
      <span className="text-sm text-zinc-400">STEP {currentStep}</span>
      <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
      <span className="text-sm text-zinc-400">{totalSteps}</span>
    </div>
  );
}
