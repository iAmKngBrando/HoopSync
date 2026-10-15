/** Mirrors BoardColumn in src/main/devBoard.ts. */
export type BoardColumn = 'todo' | 'doing' | 'done';

/** Mirrors BoardTag in src/main/devBoard.ts. */
export type BoardTag = 'core' | 'cleanup' | 'nice-to-have';

/** Mirrors BoardCard in src/main/devBoard.ts. */
export interface BoardCard {
  id: string;
  title: string;
  note?: string;
  column: BoardColumn;
  tag?: BoardTag;
  author?: string;
  createdAt: string;
}

export const COLUMNS: { key: BoardColumn; label: string }[] = [
  { key: 'todo', label: 'To Do' },
  { key: 'doing', label: 'In Progress' },
  { key: 'done', label: 'Done' },
];

export const TAG_STYLES: Record<BoardTag, { label: string; className: string }> = {
  core: { label: 'Core', className: 'bg-primary/15 text-primary' },
  cleanup: { label: 'Cleanup', className: 'bg-accent-blue/15 text-accent-blue' },
  'nice-to-have': { label: 'Nice to have', className: 'bg-muted text-foreground-secondary' },
};
