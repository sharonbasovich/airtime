export const C = {
  bg: '#0B0D12',
  card: '#161A22',
  cardHi: '#1E2430',
  text: '#F4F6FB',
  dim: '#8C94A6',
  accent: '#C6FF3D',
  go: '#3DDC84',
  easy: '#FFC53D',
  rest: '#FF5C5C',
  pro: '#8B7CFF',
  border: '#2A3140',
};

export const CALL_COPY = {
  go: { label: 'GO', color: C.go, line: 'Springs are on. Train as planned.' },
  easy: { label: 'EASY', color: C.easy, line: 'Below your normal range. Keep it light today.' },
  rest: { label: 'REST', color: C.rest, line: 'Well below baseline. Recovery day.' },
} as const;
