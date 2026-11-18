export function cefrLabel(cefr: string): string {
  if (cefr === 'any') return 'Открытая';
  return `Уровень ${cefr.toUpperCase()}`;
}

export function cefrBadgeClass(cefr: string): string {
  const c = (cefr || '').toLowerCase();
  if (c === 'any') return 'cefr-badge cefr-badge--amber';
  if (/a0|a1/.test(c)) return 'cefr-badge cefr-badge--blue';
  if (/a2|b1/.test(c)) return 'cefr-badge cefr-badge--green';
  if (/b2|c1|c2/.test(c)) return 'cefr-badge cefr-badge--rose';
  return 'cefr-badge cefr-badge--neutral';
}
