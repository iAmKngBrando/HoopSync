export interface FrameBufferEntry {
  /** ms, from the buffer's injected clock (performance.now() in production). */
  timestamp: number;
  /** Downscaled JPEG data URL - cheap enough to keep several seconds of these in memory. */
  thumbnail: string;
  width: number;
  height: number;
}

export interface FrameBufferStats {
  count: number;
  oldestAgeMs: number | null;
  newestAgeMs: number | null;
  spanMs: number | null;
}

export interface RingFrameBufferOptions {
  maxAgeMs: number;
  maxCount: number;
  /** Injectable clock for tests; defaults to Date.now. */
  now?: () => number;
}

/**
 * Rolling in-memory buffer of recently captured frames (brief Section 7). Frames older
 * than `maxAgeMs`, or beyond `maxCount`, are evicted from the front automatically. This
 * exists so a future screen detector (Phase 3+) can look backward at pre-trigger frames
 * once it recognizes a short-lived screen, rather than only seeing frames captured after
 * detection fires - a scoreboard visible for ~0.5s can otherwise disappear before a
 * "start recording" reaction has a chance to run.
 */
export class RingFrameBuffer {
  private entries: FrameBufferEntry[] = [];
  private readonly maxAgeMs: number;
  private readonly maxCount: number;
  private readonly now: () => number;

  constructor(options: RingFrameBufferOptions) {
    this.maxAgeMs = options.maxAgeMs;
    this.maxCount = options.maxCount;
    this.now = options.now ?? Date.now;
  }

  push(entry: FrameBufferEntry): void {
    this.entries.push(entry);
    this.evict();
  }

  getAll(): readonly FrameBufferEntry[] {
    this.evict();
    return this.entries;
  }

  clear(): void {
    this.entries = [];
  }

  stats(): FrameBufferStats {
    this.evict();
    const first = this.entries[0];
    const last = this.entries[this.entries.length - 1];
    if (!first || !last) {
      return { count: 0, oldestAgeMs: null, newestAgeMs: null, spanMs: null };
    }
    const now = this.now();
    return {
      count: this.entries.length,
      oldestAgeMs: now - first.timestamp,
      newestAgeMs: now - last.timestamp,
      spanMs: last.timestamp - first.timestamp,
    };
  }

  private evict(): void {
    const cutoff = this.now() - this.maxAgeMs;
    while (this.entries.length > 0) {
      const oldest = this.entries[0];
      if (!oldest || oldest.timestamp >= cutoff) break;
      this.entries.shift();
    }
    while (this.entries.length > this.maxCount) {
      this.entries.shift();
    }
  }
}
