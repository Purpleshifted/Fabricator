import React, { useState, useCallback, useEffect } from 'react';

interface ProgressTrackerProps {
  totalRows: number;
  gridWidth: number;
  cells: number[];
  onRowChange?: (row: number) => void;
  className?: string;
}

/**
 * Progress tracker for filet crochet work.
 * Features:
 * - Large "smashable" counter button (designed for tapping while looking at work)
 * - Current row display with direction indicator (→ or ←)
 * - Row-specific notes/reminders
 * - Wake Lock API to prevent screen from dimming
 * - Haptic feedback on tap
 * - Progress bar
 */
const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  totalRows,
  gridWidth,
  cells,
  onRowChange,
  className,
}) => {
  const [currentRow, setCurrentRow] = useState(0);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');

  const progress = totalRows > 0 ? ((currentRow + 1) / totalRows) * 100 : 0;
  const isRightToLeft = currentRow % 2 === 1; // odd rows read ←
  const direction = isRightToLeft ? '←' : '→';

  /* ─── Row navigation ─── */
  const goToRow = useCallback(
    (row: number) => {
      const clamped = Math.max(0, Math.min(totalRows - 1, row));
      setCurrentRow(clamped);
      onRowChange?.(clamped);

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(30);
      }
    },
    [totalRows, onRowChange]
  );

  const nextRow = useCallback(() => goToRow(currentRow + 1), [currentRow, goToRow]);
  const prevRow = useCallback(() => goToRow(currentRow - 1), [currentRow, goToRow]);

  /* ─── Row instruction ─── */
  const getRowInstruction = useCallback(() => {
    if (!cells || cells.length === 0) return '';
    const rowCells: number[] = [];
    for (let col = 0; col < gridWidth; col++) {
      rowCells.push(cells[currentRow * gridWidth + col]);
    }

    // Generate simplified instruction
    const segments: Array<{ type: number; count: number }> = [];
    let lastType = rowCells[0];
    let count = 1;

    for (let i = 1; i < rowCells.length; i++) {
      if (rowCells[i] === lastType) {
        count++;
      } else {
        segments.push({ type: lastType, count });
        lastType = rowCells[i];
        count = 1;
      }
    }
    segments.push({ type: lastType, count });

    // If reading right to left, reverse
    const ordered = isRightToLeft ? [...segments].reverse() : segments;

    return ordered
      .map((s) => {
        const name = s.type === 1 ? 'bl' : s.type === 2 ? 'lac' : s.type === 3 ? 'pf' : 'sp';
        return `${s.count}${name}`;
      })
      .join(', ');
  }, [cells, gridWidth, currentRow, isRightToLeft]);

  /* ─── Wake Lock ─── */
  const toggleWakeLock = useCallback(async () => {
    if (wakeLockActive && wakeLock) {
      await wakeLock.release();
      setWakeLock(null);
      setWakeLockActive(false);
    } else {
      try {
        const sentinel = await navigator.wakeLock.request('screen');
        setWakeLock(sentinel);
        setWakeLockActive(true);
        sentinel.addEventListener('release', () => {
          setWakeLockActive(false);
          setWakeLock(null);
        });
      } catch {
        // Wake Lock not supported or permission denied
        console.warn('Wake Lock not available');
      }
    }
  }, [wakeLockActive, wakeLock]);

  /* ─── Notes ─── */
  const addNote = useCallback(() => {
    if (noteText.trim()) {
      setNotes((prev) => ({ ...prev, [currentRow]: noteText.trim() }));
      setNoteText('');
      setShowNoteInput(false);
    }
  }, [noteText, currentRow]);

  /* ─── Keyboard shortcuts ─── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'ArrowUp' || e.key === ' ') {
        e.preventDefault();
        nextRow();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        prevRow();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [nextRow, prevRow]);

  return (
    <div className={`progress-tracker ${className || ''}`}>
      {/* Progress bar */}
      <div className="progress-tracker__bar">
        <div
          className="progress-tracker__bar-fill"
          style={{ width: `${progress}%` }}
        />
        <span className="progress-tracker__bar-text">
          {Math.round(progress)}% — Row {currentRow + 1} of {totalRows}
        </span>
      </div>

      {/* Current row info */}
      <div className="progress-tracker__row-info">
        <div className="progress-tracker__row-number">
          <span className="progress-tracker__direction">{direction}</span>
          <span className="progress-tracker__current">Row {currentRow + 1}</span>
        </div>
        <div className="progress-tracker__instruction">
          {getRowInstruction()}
        </div>
        {notes[currentRow] && (
          <div className="progress-tracker__note">
            📌 {notes[currentRow]}
          </div>
        )}
      </div>

      {/* Large counter area */}
      <div className="progress-tracker__counter-area">
        <button
          className="progress-tracker__back-btn"
          onClick={prevRow}
          disabled={currentRow <= 0}
        >
          ◀ Prev
        </button>
        <button
          className="progress-tracker__next-btn"
          onClick={nextRow}
          disabled={currentRow >= totalRows - 1}
        >
          <span className="progress-tracker__next-label">Next Row</span>
          <span className="progress-tracker__next-hint">tap or press Space</span>
        </button>
      </div>

      {/* Controls */}
      <div className="progress-tracker__controls">
        <button
          className={`tracker-ctrl-btn ${wakeLockActive ? 'tracker-ctrl-btn--active' : ''}`}
          onClick={toggleWakeLock}
          title="Keep screen on"
        >
          {wakeLockActive ? '🔆 Screen On' : '🔅 Keep Screen On'}
        </button>

        <button
          className="tracker-ctrl-btn"
          onClick={() => setShowNoteInput(!showNoteInput)}
          title="Add note to this row"
        >
          📝 Note
        </button>

        <div className="tracker-ctrl-btn__row-jump">
          <label>Go to row:</label>
          <input
            type="number"
            min={1}
            max={totalRows}
            value={currentRow + 1}
            onChange={(e) => goToRow(Number(e.target.value) - 1)}
            className="row-jump-input"
          />
        </div>
      </div>

      {/* Note input */}
      {showNoteInput && (
        <div className="progress-tracker__note-input">
          <input
            type="text"
            placeholder={`Note for row ${currentRow + 1}...`}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addNote()}
            autoFocus
          />
          <button className="btn btn--primary btn--sm" onClick={addNote}>
            Save
          </button>
        </div>
      )}
    </div>
  );
};

export default ProgressTracker;
