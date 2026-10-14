import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';

interface AddOpponentDialogProps {
  onAdd: (name: string, gamertag?: string) => void;
  onClose: () => void;
}

const inputClass =
  'w-full rounded-lg border border-border-muted bg-inset px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20';

export function AddOpponentDialog({ onAdd, onClose }: AddOpponentDialogProps) {
  const [name, setName] = useState('');
  const [gamertag, setGamertag] = useState('');

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim(), gamertag.trim() || undefined);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-opponent-title"
        className="glass w-full max-w-md rounded-card p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 id="add-opponent-title" className="text-base font-semibold text-foreground">
            Add Opponent
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
            <label htmlFor="opponent-name" className="mb-1.5 block text-xs font-medium text-foreground-secondary">
              Name *
            </label>
            <input
              id="opponent-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Opponent name"
              className={inputClass}
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="opponent-gamertag" className="mb-1.5 block text-xs font-medium text-foreground-secondary">
              Gamertag (optional)
            </label>
            <input
              id="opponent-gamertag"
              type="text"
              value={gamertag}
              onChange={(e) => setGamertag(e.target.value)}
              placeholder="Gamertag"
              className={inputClass}
            />
          </div>
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
              disabled={!name.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-primary-hover disabled:opacity-40"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
