interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function v_3183b2({ currentStep: v_91943c, totalSteps: v_be48b1 }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2 mb-8">
      <span className="text-sm text-zinc-400">STEP {v_91943c}</span>
      <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
          style={{ width: `${(v_91943c / v_be48b1) * 100}%` }}
        />
      </div>
      <span className="text-sm text-zinc-400">{v_be48b1}</span>
    </div>
  );
}
