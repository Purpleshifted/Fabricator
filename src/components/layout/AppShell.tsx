import React from 'react';
import { useProjectStore } from '../../store/projectStore.ts';
import { StepWizard } from './StepWizard.tsx';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const currentStep = useProjectStore((s) => s.currentStep);
  const isFullWidth = currentStep === 3;

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="app-header">
        <div className="container">
          <div className="app-header__inner">
            {/* Logo */}
            <div className="app-header__brand">
              <svg
                className="app-header__logo-icon"
                width="28"
                height="28"
                viewBox="0 0 28 28"
                fill="none"
              >
                {/* Stylized crochet hook icon */}
                <path
                  d="M8 4C8 4 6 6 6 9C6 12 8 13 8 16C8 19 6 22 6 22"
                  stroke="url(#hookGrad)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M14 4C14 4 12 6 12 9C12 12 14 13 14 16C14 19 12 22 12 22"
                  stroke="url(#hookGrad)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  opacity="0.7"
                />
                <path
                  d="M20 4C20 4 18 6 18 9C18 12 20 13 20 16C20 19 18 22 18 22"
                  stroke="url(#hookGrad)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  opacity="0.4"
                />
                <defs>
                  <linearGradient id="hookGrad" x1="0" y1="4" x2="0" y2="22">
                    <stop stopColor="#D4A574" />
                    <stop offset="1" stopColor="#9A6A3A" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="app-header__brand-text">
                <h1 className="app-header__title">FiletForge</h1>
                <span className="app-header__subtitle">Pattern Generator</span>
              </div>
            </div>

            {/* Step wizard */}
            <div className="app-header__wizard">
              <StepWizard />
            </div>
          </div>
        </div>
      </header>

      {/* Main content — full width for Step 3, contained for Steps 1 & 2 */}
      <main className={`app-main ${isFullWidth ? 'app-main--full' : ''}`}>
        {isFullWidth ? children : <div className="container">{children}</div>}
      </main>

      <style>{`
        .app-shell {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        .app-header {
          position: sticky;
          top: 0;
          z-index: var(--z-sticky);
          height: var(--header-height);
          background: rgba(15, 15, 26, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--color-border-subtle);
          flex-shrink: 0;
        }

        .app-header__inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: var(--header-height);
          gap: var(--space-8);
        }

        .app-header__brand {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          flex-shrink: 0;
        }

        .app-header__brand-text {
          display: flex;
          flex-direction: column;
        }

        .app-header__title {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-bold);
          letter-spacing: var(--letter-spacing-tight);
          background: linear-gradient(135deg, var(--color-amber-200) 0%, var(--color-amber-400) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1.1;
        }

        .app-header__subtitle {
          font-size: 10px;
          font-weight: var(--font-weight-medium);
          color: var(--color-text-tertiary);
          text-transform: uppercase;
          letter-spacing: var(--letter-spacing-wider);
        }

        .app-header__wizard {
          flex: 1;
          max-width: 460px;
        }

        .app-main {
          flex: 1;
          padding-top: var(--space-8);
          padding-bottom: var(--space-12);
        }

        /* Step 3 (grid editor) — no container, no extra padding */
        .app-main--full {
          padding-top: 0;
          padding-bottom: 0;
          overflow: hidden;
        }

        @media (max-width: 768px) {
          .app-header__inner {
            gap: var(--space-4);
          }
          .app-header__subtitle {
            display: none;
          }
          .app-header__wizard {
            max-width: 260px;
          }
        }
      `}</style>
    </div>
  );
};
