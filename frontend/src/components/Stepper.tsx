import React from 'react';

interface StepperProps {
  steps: string[];
  currentStep: number;
  onStepSelect?: (index: number) => void;
}

const Stepper: React.FC<StepperProps> = ({ steps, currentStep, onStepSelect }) => {
  return (
    <nav aria-label="Progresso" className="w-full">
      <ol className="flex flex-wrap gap-3" role="list">
        {steps.map((label, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const baseClasses = 'px-3 py-1 rounded-full text-sm font-medium border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1';
          const stateClasses = isActive
            ? 'bg-blue-600 text-white border-blue-600'
            : isCompleted
              ? 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50';

          const button = (
            <button
              type="button"
              className={`${baseClasses} ${stateClasses}`}
              onClick={() => onStepSelect?.(index)}
              disabled={!isCompleted || !onStepSelect}
              aria-current={isActive ? 'step' : undefined}
            >
              <span className="font-semibold mr-1">{index + 1}.</span>
              {label}
            </button>
          );

          return (
            <li key={label} className="flex items-center gap-2">
              {button}
              {index < steps.length - 1 && <span className="text-gray-300">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Stepper;
