/**
 * Formats a number with comma separation and optional Kurdish numerals
 */
export function formatNumber(num: number | string | undefined | null, useKurdish = false): string {
  if (num === undefined || num === null || isNaN(Number(num))) {
    return useKurdish ? '٠' : '0';
  }

  const standardFormatted = Number(num).toLocaleString('en-US');

  if (!useKurdish) {
    return standardFormatted;
  }

  const kurdishDigits: { [key: string]: string } = {
    '0': '٠',
    '1': '١',
    '2': '٢',
    '3': '٣',
    '4': '٤',
    '5': '٥',
    '6': '٦',
    '7': '٧',
    '8': '٨',
    '9': '٩',
    ',': '،',
    '.': '٫',
  };

  return standardFormatted.replace(/[0-9,\.]/g, (match) => kurdishDigits[match] || match);
}

/**
 * Formats a percentage value (e.g. 24.5%)
 */
export function formatPercentage(val: number, useKurdish = false, decimals = 2): string {
  if (isNaN(val) || !isFinite(val) || val <= 0) {
    return useKurdish ? '٠٪' : '0%';
  }
  const formatted = val.toFixed(decimals);
  if (!useKurdish) {
    return `${formatted}%`;
  }
  const kurdishNum = formatNumber(formatted, true);
  return `${kurdishNum}٪`;
}

/**
 * Calculates percentage strictly based on Valid Votes (دەنگی دروستی تەواو)
 */
export function calculateVotePercentage(votes: number, validVotes: number): number {
  if (!validVotes || validVotes <= 0 || !votes || votes <= 0) {
    return 0;
  }
  const pct = (votes / validVotes) * 100;
  return Math.min(100, Math.max(0, pct));
}
