import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { Card, EmptyState, SectionHeader } from '../../components/ui/Card';
import { useFriendsConfig } from '../friends/FriendsContext';
import { COLUMNS, tagStyle, type BoardCard, type BoardColumn, type BoardTagDef } from './types';

const inputClass =
  'w-full rounded-lg border border-border-muted bg-inset px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20';

/**
 * Lite kanban for tracking a handful of dev to-dos, backed by references/dev-board.json
 * (checked into git, so it syncs between co-developers via normal commits/pushes - see
 * §34b "Decisions & Additions" in the product brief for why). Dev-only: pull this tab
 * before shipping a production build.
 */
export function DevBoardPanel() {
  const { config } = useFriendsConfig();
  const [cards, setCards] = useState<BoardCard[] | null>(null);
  const [tags, setTags] = useState<BoardTagDef[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [tag, setTag] = useState('');
  const [addingTag, setAddingTag] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [tagDraft, setTagDraft] = useState('');

  const api = window.hoopsync?.devBoard;

  useEffect(() => {
    if (!api) return;
    api.list().then(setCards).catch((e) => setError(String(e)));
    api.listTags().then(setTags).catch((e) => setError(String(e)));
  }, [api]);

  if (!api) {
    return (
      <Card label="Developer board">
        <SectionHeader title="DEV BOARD" />
        <EmptyState
          title="Electron app only"
          hint="The dev board reads/writes references/dev-board.json via the Electron app - it's not available in the plain-browser dev mode."
        />
      </Card>
    );
  }

  async function addCard() {
    if (!title.trim()) return;
    try {
      const next = await api!.addCard(title, note || undefined, tag || undefined, config.playerName || undefined);
      setCards(next);
      setTitle('');
      setNote('');
      setTag('');
    } catch (e) {
      setError(String(e));
    }
  }

  async function move(id: string, column: BoardColumn) {
    try {
      setCards(await api!.moveCard(id, column));
    } catch (e) {
      setError(String(e));
    }
  }

  async function remove(id: string) {
    try {
      setCards(await api!.deleteCard(id));
    } catch (e) {
      setError(String(e));
    }
  }

  async function addNewTag() {
    if (!newTag.trim()) return;
    try {
      setTags(await api!.addTag(newTag));
      setNewTag('');
      setAddingTag(false);
    } catch (e) {
      setError(String(e));
    }
  }

  async function rename(name: string) {
    try {
      setTags(await api!.renameTag(name, tagDraft));
      setEditingTag(null);
      setCards(await api!.list()); // renamed tags rewrite the cards that use them
    } catch (e) {
      setError(String(e));
    }
  }

  async function removeTag(name: string) {
    try {
      setTags(await api!.deleteTag(name));
      setCards(await api!.list()); // deleted tags are cleared from cards
      if (tag === name) setTag('');
    } catch (e) {
      setError(String(e));
    }
  }

  return (
    <Card label="Developer board">
      <SectionHeader title="DEV BOARD" note="checked into git - commit + push to share" />
      <p className="mb-4 text-xs text-foreground-secondary">
        A few shared to-dos, not a full tracker. Add something, move it across as it progresses, and
        commit/push <code className="rounded bg-inset px-1 py-0.5">references/dev-board.json</code> like
        any other change so it shows up for the other person next time they pull.
      </p>

      {error && <p className="mb-3 text-xs text-destructive">{error}</p>}

      <div className="mb-4 grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1fr_1fr_auto_auto]">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addCard()}
          placeholder="Add a to-do..."
          className={`${inputClass} col-span-2 sm:col-span-1`}
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addCard()}
          placeholder="Note (optional)"
          className={`${inputClass} col-span-2 sm:col-span-1`}
        />
        <select value={tag} onChange={(e) => setTag(e.target.value)} className={inputClass}>
          <option value="">No tag</option>
          {tags.map((t) => (
            <option key={t.name} value={t.name}>
              {tagStyle(t.name).label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={addCard}
          disabled={!title.trim()}
          className="flex items-center justify-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-primary-hover disabled:opacity-40"
        >
          <Plus className="size-4" />
          Add
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[11px] font-bold uppercase tracking-wide text-foreground-secondary">
          Tags
        </span>
        {tags.map((t) =>
          editingTag === t.name ? (
            <input
              key={t.name}
              autoFocus
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') rename(t.name);
                if (e.key === 'Escape') setEditingTag(null);
              }}
              className="w-28 rounded border border-border-muted bg-inset px-1.5 py-0.5 text-[10px] font-semibold text-foreground focus:border-primary/60 focus:outline-none"
            />
          ) : (
            <span
              key={t.name}
              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ${tagStyle(t.name).className}`}
            >
              {tagStyle(t.name).label}
              {!t.builtin && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTag(t.name);
                      setTagDraft(t.name);
                    }}
                    aria-label={`Rename tag ${t.name}`}
                    title="Rename tag"
                    className="opacity-60 transition-opacity hover:opacity-100"
                  >
                    <Pencil className="size-2.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeTag(t.name)}
                    aria-label={`Delete tag ${t.name}`}
                    title="Delete tag"
                    className="opacity-60 transition-opacity hover:opacity-100"
                  >
                    <X className="size-3" aria-hidden="true" />
                  </button>
                </>
              )}
            </span>
          ),
        )}
        {addingTag ? (
          <input
            autoFocus
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addNewTag();
              if (e.key === 'Escape') {
                setAddingTag(false);
                setNewTag('');
              }
            }}
            placeholder="New tag"
            className="w-28 rounded border border-border-muted bg-inset px-1.5 py-0.5 text-[10px] font-semibold text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setAddingTag(true)}
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Plus className="size-3" aria-hidden="true" />
            Add Tag
          </button>
        )}
      </div>

      {cards === null ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          {COLUMNS.map((col) => {
            const colCards = cards.filter((c) => c.column === col.key);
            return (
              <div key={col.key} className="flex flex-col gap-2 rounded-lg border border-border-soft bg-inset/50 p-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-foreground-secondary">{col.label}</span>
                  <span className="text-[11px] text-muted-foreground">{colCards.length}</span>
                </div>
                {colCards.length === 0 && <p className="px-1 text-xs text-muted-foreground">Nothing here.</p>}
                {colCards.map((c) => (
                  <BoardCardItem key={c.id} card={c} onMove={move} onDelete={remove} />
                ))}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function BoardCardItem({
  card,
  onMove,
  onDelete,
}: {
  card: BoardCard;
  onMove: (id: string, column: BoardColumn) => void;
  onDelete: (id: string) => void;
}) {
  const colIndex = COLUMNS.findIndex((c) => c.key === card.column);
  const prevColumn = COLUMNS[colIndex - 1]?.key;
  const nextColumn = COLUMNS[colIndex + 1]?.key;

  return (
    <div className="glass rounded-lg p-2.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{card.title}</p>
        <button
          type="button"
          onClick={() => onDelete(card.id)}
          aria-label="Delete"
          className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
      {card.note && <p className="mt-1 text-xs text-foreground-secondary">{card.note}</p>}
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {card.tag && (
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${tagStyle(card.tag).className}`}>
              {tagStyle(card.tag).label}
            </span>
          )}
          {card.author && <span className="text-[10px] text-muted-foreground">by {card.author}</span>}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={!prevColumn}
            onClick={() => prevColumn && onMove(card.id, prevColumn)}
            className="rounded px-1.5 py-0.5 text-xs text-foreground-secondary transition-colors hover:bg-muted disabled:opacity-30"
          >
            ←
          </button>
          <button
            type="button"
            disabled={!nextColumn}
            onClick={() => nextColumn && onMove(card.id, nextColumn)}
            className="rounded px-1.5 py-0.5 text-xs text-foreground-secondary transition-colors hover:bg-muted disabled:opacity-30"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
