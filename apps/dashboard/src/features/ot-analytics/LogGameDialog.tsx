import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { NewGameResult } from '../tracker-data/api';

const gameModes = ['Rec', 'Park', 'Pro-Am', 'Theater', 'Play Now Online'];

interface LogGameDialogProps {
  /** Existing opponent names offered as suggestions */
  opponentNames: string[];
  /** Pre-fills the opponent field, e.g. when logging from an opponent's page */
  defaultOpponent?: string;
  /** Resolves when saved; a rejected promise's message is shown in the dialog */
  onSubmit: (result: NewGameResult) => Promise<void>;
  onClose: () => void;
}

const inputClass =
  'w-full rounded-lg border border-border-muted bg-inset px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20';
const labelClass = 'mb-1.5 block text-xs font-medium text-foreground-secondary';

export function LogGameDialog({ opponentNames, defaultOpponent = '', onSubmit, onClose }: LogGameDialogProps) {
  const [opponent, setOpponent] = useState(defaultOpponent);
  const [yourScore, setYourScore] = useState('');
  const [opponentScore, setOpponentScore] = useState('');
  const [mode, setMode] = useState<string>(gameModes[0] ?? 'Rec');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const yours = Number.parseInt(yourScore, 10);
  const theirs = Number.parseInt(opponentScore, 10);
  const scoresValid = Number.isInteger(yours) && Number.isInteger(theirs) && yours >= 0 && theirs >= 0;
  const isTie = scoresValid && yours === theirs;
  const canSubmit = opponent.trim().length > 0 && scoresValid && !isTie && mode.trim().length > 0 && !saving;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        opponent_name: opponent.trim(),
        your_score: yours,
        opponent_score: theirs,
        game_type: mode.trim(),
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save the game');
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="log-game-title"
        className="glass w-full max-w-md rounded-card p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 id="log-game-title" className="text-base font-semibold text-foreground">
            Log Game
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-foreground-secondary transition-colors hover:bg-white/5 hover:text-foreground"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="game-opponent" className={labelClass}>
              Opponent
            </label>
            <input
              id="game-opponent"
              type="text"
              list="game-opponent-options"
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
              placeholder="Name (new opponents are added automatically)"
              className={inputClass}
              autoFocus
            />
            <datalist id="game-opponent-options">
              {opponentNames.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="game-your-score" className={labelClass}>
                Your score
              </label>
              <input
                id="game-your-score"
                type="number"
                inputMode="numeric"
                min={0}
                max={999}
                value={yourScore}
                onChange={(e) => setYourScore(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="game-opponent-score" className={labelClass}>
                Opponent score
              </label>
              <input
                id="game-opponent-score"
                type="number"
                inputMode="numeric"
                min={0}
                max={999}
                value={opponentScore}
                onChange={(e) => setOpponentScore(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="game-mode" className={labelClass}>
              Mode
            </label>
            <input
              id="game-mode"
              type="text"
              list="game-mode-options"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className={inputClass}
            />
            <datalist id="game-mode-options">
              {gameModes.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </div>

          {(isTie || error) && (
            <p role="alert" className="text-xs text-destructive">
              {isTie ? 'A game cannot end in a tie.' : error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border-muted px-4 py-2 text-sm font-medium text-foreground-secondary transition-colors hover:bg-white/5 hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-primary-hover disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Save Game'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
