import { describe, expect, it } from "vitest";
import { RingFrameBuffer } from "./frameBuffer";

function entry(timestamp: number) {
  return { timestamp, thumbnail: "data:image/jpeg;base64,", width: 10, height: 10 };
}

describe("RingFrameBuffer", () => {
  it("reports empty stats with nothing pushed", () => {
    const buffer = new RingFrameBuffer({ maxAgeMs: 2000, maxCount: 40 });
    expect(buffer.stats()).toEqual({ count: 0, oldestAgeMs: null, newestAgeMs: null, spanMs: null });
  });

  it("evicts entries older than maxAgeMs", () => {
    let now = 0;
    const buffer = new RingFrameBuffer({ maxAgeMs: 1000, maxCount: 100, now: () => now });

    buffer.push(entry(now)); // t=0
    now = 500;
    buffer.push(entry(now)); // t=500
    now = 1200; // t=0 is now 1200ms old -> evicted, t=500 is 700ms old -> kept

    expect(buffer.getAll().map((f) => f.timestamp)).toEqual([500]);
  });

  it("caps at maxCount even when frames are recent", () => {
    let now = 0;
    const buffer = new RingFrameBuffer({ maxAgeMs: 60_000, maxCount: 3, now: () => now });

    for (let i = 0; i < 5; i++) {
      buffer.push(entry(now));
      now += 10;
    }

    const all = buffer.getAll();
    expect(all).toHaveLength(3);
    expect(all.map((f) => f.timestamp)).toEqual([20, 30, 40]);
  });

  it("computes span/age stats relative to the injected clock", () => {
    let now = 0;
    const buffer = new RingFrameBuffer({ maxAgeMs: 60_000, maxCount: 100, now: () => now });

    buffer.push(entry(0));
    now = 100;
    buffer.push(entry(100));
    now = 250;

    expect(buffer.stats()).toEqual({ count: 2, oldestAgeMs: 250, newestAgeMs: 150, spanMs: 100 });
  });

  it("clear() empties the buffer", () => {
    const buffer = new RingFrameBuffer({ maxAgeMs: 1000, maxCount: 10 });
    buffer.push(entry(Date.now()));
    buffer.clear();
    expect(buffer.getAll()).toHaveLength(0);
  });
});
