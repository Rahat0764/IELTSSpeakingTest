export function evaluateFillerWords(text: string): number {
  const fillers = /\b(uh|um|ah|er|hmm|like|you know)\b/gi;
  const matches = text.match(fillers);
  return matches ? matches.length : 0;
}