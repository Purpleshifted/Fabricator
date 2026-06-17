import React, { useMemo } from 'react';
import { useProjectStore } from '../../store/projectStore.ts';
import type { StepId } from '../../store/projectStore.ts';

interface Step {
  num: StepId;
  label: string;
  icon: string;
}

const STEPS: Step[] = [
  { num: 1,   label: 'Design',  icon: '✂️' },
  { num: 2,   label: 'Size',    icon: '📐' },
  { num: 2.5, label: 'Pieces',  icon: '🧩' },
  { num: 3,   label: 'Pattern', icon: '🧶' },
];

export const StepWizard: React.FC = () => {
  const currentStep = useProjectStore((s) => s.currentStep);
  const setStep = useProjectStore((s) => s.setStep);

  const progressPercent = useMemo(() => {
    const idx = STEPS.findIndex((s) => s.num === currentStep);
    return (Math.max(0, idx) / (STEPS.length - 1)) * 100;
  }, [currentStep]);

  const handleStepClick = (step: StepId) => {
    // Allow navigating to current or earlier steps, or to the next step
    const currentIdx = STEPS.findIndex((s) => s.num === currentStep);
    const targetIdx = STEPS.findIndex((s) => s.num === step);
    if (targetIdx <= currentIdx + 1) {
      setStep(step);
    }
  };

  return (
    <nav className="step-wizard" aria-label="Progress steps">
      {/* Progress rail */}
      <div className="step-wizard__rail">
        <div
          className="step-wizard__fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Step circles */}
      <div className="step-wizard__steps">
        {STEPS.map((step) => {
          const stepIdx = STEPS.findIndex((s) => s.num === step.num);
          const currentIdx = STEPS.findIndex((s) => s.num === currentStep);
          const isActive = step.num === currentStep;
          const isCompleted = stepIdx < currentIdx;
          const isClickable = stepIdx <= currentIdx + 1;

          return (
            <button
              key={step.num}
              className={[
                'step-wizard__step',
                isActive && 'step-wizard__step--active',
                isCompleted && 'step-wizard__step--completed',
                !isClickable && 'step-wizard__step--disabled',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => handleStepClick(step.num)}
              disabled={!isClickable}
              aria-current={isActive ? 'step' : undefined}
            >
              <span className="step-wizard__circle">
                {isCompleted ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M3 8.5L6.5 12L13 4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <span className="step-wizard__icon">{step.icon}</span>
                )}
              </span>
              <span className="step-wizard__label">{step.label}</span>
            </button>
          );
        })}
      </div>

      <style>{`
        .step-wizard {
          position: relative;
          padding: 0 var(--space-4);
        }

        .step-wizard__rail {
          position: absolute;
          top: 20px;
          left: 60px;
          right: 60px;
          height: 3px;
          background: var(--color-bg-surface);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .step-wizard__fill {
          height: 100%;
          background: linear-gradient(90deg, var(--color-amber-400), var(--color-amber-300));
          border-radius: var(--radius-full);
          transition: width 500ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .step-wizard__steps {
          display: flex;
          justify-content: space-between;
          position: relative;
          z-index: 1;
        }

        .step-wizard__step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-2);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          min-width: 64px;
          -webkit-tap-highlight-color: transparent;
          transition: opacity var(--transition-fast);
        }

        .step-wizard__step--disabled {
          cursor: not-allowed;
          opacity: 0.35;
        }

        .step-wizard__circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-bg-elevated);
          border: 2px solid var(--color-border-subtle);
          transition: all var(--transition-base);
          font-size: 16px;
        }

        .step-wizard__step--active .step-wizard__circle {
          border-color: var(--color-amber-300);
          background: rgba(212, 165, 116, 0.12);
          box-shadow: 0 0 16px rgba(212, 165, 116, 0.2);
          transform: scale(1.1);
        }

        .step-wizard__step--completed .step-wizard__circle {
          border-color: var(--color-amber-400);
          background: var(--color-amber-500);
          color: var(--color-bg-deep);
        }

        .step-wizard__label {
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-tertiary);
          text-transform: uppercase;
          letter-spacing: var(--letter-spacing-wider);
          transition: color var(--transition-fast);
        }

        .step-wizard__step--active .step-wizard__label {
          color: var(--color-amber-300);
          font-weight: var(--font-weight-semibold);
        }

        .step-wizard__step--completed .step-wizard__label {
          color: var(--color-text-secondary);
        }

        @media (max-width: 768px) {
          .step-wizard__rail {
            left: 40px;
            right: 40px;
          }
          .step-wizard__circle {
            width: 36px;
            height: 36px;
          }
          .step-wizard__label {
            font-size: 10px;
          }
        }
      `}</style>
    </nav>
  );
};
