export type JumpOffEntry = { name: string; heightCm: number };

export type JumpOffRow = JumpOffEntry & { rank: number };

/** Best jump per athlete, ranked high → low; ties share a rank. */
export function leaderboard(entries: JumpOffEntry[]): JumpOffRow[] {
  const best = new Map<string, number>();
  for (const e of entries) {
    const name = e.name.trim() || 'Anonymous';
    best.set(name, Math.max(best.get(name) ?? -Infinity, e.heightCm));
  }
  const sorted = [...best.entries()].map(([name, heightCm]) => ({ name, heightCm })).sort((a, b) => b.heightCm - a.heightCm);
  let rank = 0;
  let last = Number.NaN;
  return sorted.map((row, i) => {
    const rounded = Math.round(row.heightCm);
    if (rounded !== last) rank = i + 1;
    last = rounded;
    return { ...row, rank };
  });
}
