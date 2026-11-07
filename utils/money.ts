export function formatMoneyInput(value: string | number | null | undefined): string {
  const raw = String(value ?? '').replace(/[^\d.-]/g, '');
  if (!raw) return '';
  const negative = raw.startsWith('-');
  const unsigned = raw.replace(/-/g, '');
  const [integerPart, ...decimalParts] = unsigned.split('.');
  const integer = (integerPart || '0').replace(/^0+(?=\d)/, '');
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const decimals = decimalParts.join('').slice(0, 2);
  return `${negative ? '-' : ''}${grouped}${decimalParts.length ? `.${decimals}` : ''}`;
}
export function moneyNumber(value: string | number | null | undefined): number {
  return Number(String(value ?? '').replace(/[^\d.-]/g, '')) || 0;
}
