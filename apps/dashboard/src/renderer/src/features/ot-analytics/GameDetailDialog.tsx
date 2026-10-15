import { useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { STAT_COLUMNS, type Game, type GameStats, type StatColumn, type StatRow } from '../tracker-data/types';
import { toServerUrl, type StatsPhotoResult } from '../tracker-data/api';
import { formatDate } from '../tracker-data/format';

interface GameDetailDialogProps {
  game: Game;
  opponentName: string;
  /** Reads a stats table from a photo; resolves with a proposal to review */
  onReadPhoto: (photo: File) => Promise<StatsPhotoResult>;
  /** Saves the stats shown in the dialog */
  onSaveStats: (stats: GameStats | null) => Promise<void>;
  onClose: () => void;
}

type Draft = Record<'you' | 'opponent', Partial<Record<StatColumn, string>>>;

function toDraft(stats?: GameStats | null): Draft {
  const side = (row?: StatRow) =>
    Object.fromEntries(Object.entries(row ?? {}).map(([column, value]) => [column, String(value)]));
  return { you: side(stats?.you), opponent: side(stats?.opponent) };
}

function fromDraft(draft: Draft): GameStats | null {
  const side = (row: Draft['you']): StatRow =>
    Object.fromEntries(
      Object.entries(row)
        .map(([column, text]) => [column, text.trim()] as const)
        .filter(([, text]) => text !== '')
        // Whole numbers are stored as numbers; "8/13" and "B+" stay text.
        .map(([column, text]) => [column, /^\d+$/.test(text) ? Number(text) : text]),
    );
  const stats = { you: side(draft.you), opponent: side(draft.opponent) };
  const empty = Object.keys(stats.you).length + Object.keys(stats.opponent).length === 0;
  return empty ? null : stats;
}

const cellInput =
  'w-full min-w-12 rounded-md border border-border-muted bg-inset px-1.5 py-1 text-center text-sm tabular-nums text-foreground focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20';

export function GameDetailDialog({
  game,
  opponentName,
  onReadPhoto,
  onSaveStats,
  onClose,
}: GameDetailDialogProps) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(game.stats));
  const [photoUrl, setPhotoUrl] = useState(toServerUrl(game.stats_photo_path) ?? null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'reading' | 'saving' | null>(null);
  const [dirty, setDirty] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const setCell = (side: 'you' | 'opponent', column: StatColumn, value: string) => {
    setDraft((current) => ({ ...current, [side]: { ...current[side], [column]: value } }));
    setDirty(true);
    setNotice(null);
  };

  const handlePhoto = async (photo: File | undefined) => {
    if (!photo) return;
    setBusy('reading');
    setError(null);
    setNotice(null);
    try {
      const result = await onReadPhoto(photo);
      const read = toDraft(result.stats);
      const found = Object.keys(read.you).length + Object.keys(read.opponent).length;
      // Values read from the photo fill the table; anything typed is kept
      // where the photo had nothing.
      setDraft((current) => ({
        you: { ...current.you, ...read.you },
        opponent: { ...current.opponent, ...read.opponent },
      }));
      setPhotoUrl(toServerUrl(result.photo_url) ?? null);
      setWarnings(result.warnings);
      setDirty(found > 0);
      setNotice(
        found > 0
          ? `Read ${found} values from the photo. Check them, then save.`
          : 'No stats table could be read from that photo. You can type the values in instead.',
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not read the photo');
    } finally {
      setBusy(null);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const handleSave = async () => {
    setBusy('saving');
    setError(null);
    try {
      await onSaveStats(fromDraft(draft));
      setDirty(false);
      setWarnings([]);
      setNotice('Stats saved.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save the stats');
    } finally {
      setBusy(null);
    }
  };

  const isWin = game.outcome === 'win';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-detail-title"
        className="glass flex max-h-full w-full max-w-4xl flex-col rounded-card"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border-muted p-5">
          <div className="min-w-0">
            <h3 id="game-detail-title" className="truncate text-base font-semibold text-foreground">
              vs {opponentName}
            </h3>
            <p className="mt-0.5 text-xs text-foreground-secondary">
              {formatDate(game.date)} · {game.game_type} ·{' '}
              {game.source === 'capture' ? 'Captured automatically' : 'Logged by hand'}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="text-right">
              <div
                className={cn(
                  'text-[10px] font-bold uppercase tracking-widest',
                  isWin ? 'text-success' : 'text-destructive',
                )}
              >
                {isWin ? 'Win' : 'Loss'}
              </div>
              <div className="text-xl font-bold tabular-nums leading-tight text-foreground">
                {game.your_score} - {game.opponent_score}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg p-1.5 text-foreground-secondary transition-colors hover:bg-white/5 hover:text-foreground"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="space-y-4 overflow-y-auto p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="text-sm font-semibold text-foreground">Game Stats</h4>
            <div>
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                className="sr-only"
                aria-label="Stats photo"
                onChange={(event) => handlePhoto(event.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={busy !== null}
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/15 px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/25 disabled:opacity-50"
              >
                <Camera className="size-3.5" aria-hidden="true" />
                {busy === 'reading' ? 'Reading photo…' : 'Add Stats Photo'}
              </button>
            </div>
          </div>

          <div className="panel-inset overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border-muted">
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-foreground-secondary">
                    Player
                  </th>
                  {STAT_COLUMNS.map((column) => (
                    <th
                      key={column}
                      scope="col"
                      className="px-1 py-2 text-center text-xs font-medium text-foreground-secondary"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(['you', 'opponent'] as const).map((side) => (
                  <tr key={side} className="border-b border-border-muted/60 last:border-b-0">
                    <th
                      scope="row"
                      className="whitespace-nowrap px-3 py-2 text-left text-sm font-medium text-foreground"
                    >
                      {side === 'you' ? 'You' : opponentName}
                    </th>
                    {STAT_COLUMNS.map((column) => (
                      <td key={column} className="px-1 py-1.5">
                        <input
                          type="text"
                          value={draft[side][column] ?? ''}
                          onChange={(event) => setCell(side, column, event.target.value)}
                          maxLength={12}
                          aria-label={`${side === 'you' ? 'Your' : `${opponentName}'s`} ${column}`}
                          className={cellInput}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(warnings.length > 0 || error) && (
            <ul role="alert" className="space-y-1 text-xs text-warning">
              {error && <li className="text-destructive">{error}</li>}
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
          {notice && <p className="text-xs text-foreground-secondary">{notice}</p>}

          {(photoUrl || game.start_frame_path || game.end_frame_path) && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { url: photoUrl, label: 'Stats photo' },
                { url: toServerUrl(game.start_frame_path), label: 'Matchup screen' },
                { url: toServerUrl(game.end_frame_path), label: 'End of game' },
              ]
                .filter((frame) => frame.url)
                .map((frame) => (
                  <a
                    key={frame.label}
                    href={frame.url ?? undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="group block"
                  >
                    <img
                      src={frame.url ?? undefined}
                      alt={frame.label}
                      className="aspect-video w-full rounded-inset border border-border-muted object-cover transition-colors group-hover:border-primary/50"
                    />
                    <span className="mt-1 block text-xs text-foreground-secondary">{frame.label}</span>
                  </a>
                ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border-muted p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border-muted px-4 py-2 text-sm font-medium text-foreground-secondary transition-colors hover:bg-white/5 hover:text-foreground"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || busy !== null}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-primary-hover disabled:opacity-40"
          >
            {busy === 'saving' ? 'Saving…' : 'Save Stats'}
          </button>
        </div>
      </div>
    </div>
  );
}
