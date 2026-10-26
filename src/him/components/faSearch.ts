/** Fold Arabic/Persian equivalent characters only for lookup; preserve original strings. */
export function normalizeFaSearch(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[ًٌٍَُِّْـ]/g, '')
    .replace(/[\u200c\u200d]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('fa-IR');
}
