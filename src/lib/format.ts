const kr = new Intl.NumberFormat('sv-SE', {
  style: 'currency',
  currency: 'SEK',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export function formatKr(amount: number): string {
  return kr.format(amount)
}
