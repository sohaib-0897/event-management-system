export function dateLabel(event) {
  if (event.datePending || (!event.localDate && !event.startAt)) return 'Date to be announced';
  try {
    const date = event.startAt ? new Date(event.startAt) : new Date(`${event.localDate}T12:00:00Z`);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: event.startAt ? event.timezone || 'UTC' : 'UTC' }).format(date);
  } catch { return 'Date to be announced'; }
}
export function priceLabel(event) {
  if (!event.price) return 'Price unavailable';
  try {
    const format = new Intl.NumberFormat('en-US', { style: 'currency', currency: event.price.currency, maximumFractionDigits: 0 });
    return event.price.min === event.price.max ? format.format(event.price.min) : `${format.format(event.price.min)} – ${format.format(event.price.max)}`;
  } catch { return 'Price unavailable'; }
}
