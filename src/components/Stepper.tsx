import React from 'react';
import { InkMark } from './InkMark';

interface StepperProps {
  currentStep: 1 | 2 | 3; // 1 Upload -> 2 Review -> 3 Publish
  steps?: Array<{ id: number; label: string }>;
}

/**
 * Stepper Component:
 * Stepper at top of Upload & Extraction flow with digit-boxes and drawn ink checks.
 */
export const Stepper: React.FC<StepperProps> = ({
  currentStep,
  steps = [
    { id: 1, label: 'Upload Paper' },
    { id: 2, label: 'Review Questions' },
    { id: 3, label: 'Publish Test' }
  ]
}) => {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between max-w-xl mx-auto relative">
        {/* Connecting Line */}
        <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-[2px] bg-pencil-line -z-0" />

        {steps.map((step) => {
          const isCompleted = step.id < currentStep;
          const isActive = step.id === currentStep;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
              <div
                className={`w-10 h-10 rounded-md border-1.5 flex items-center justify-center font-mono font-bold text-sm transition-all duration-200 ${
                  isCompleted
                    ? 'bg-exam-green border-exam-green text-white shadow-sm'
                    : isActive
                    ? 'bg-ink-navy border-ink-navy text-white ring-2 ring-ink-navy/20 shadow-md'
                    : 'bg-sheet border-pencil-line text-graphite-soft'
                }`}
              >
                {isCompleted ? (
                  <InkMark type="tick" size={18} className="text-white" />
                ) : (
                  <span>0{step.id}</span>
                )}
              </div>
              <span
                className={`text-xs font-sans font-medium transition-colors ${
                  isActive
                    ? 'text-ink-navy font-bold'
                    : isCompleted
                    ? 'text-exam-green font-semibold'
                    : 'text-graphite-soft'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
