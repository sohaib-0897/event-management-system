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
function dateInZone(date, timezone) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone || 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
    const get = (type) => parts.find((p) => p.type === type)?.value;
    return `${get('year')}-${get('month')}-${get('day')}`;
  } catch { return date.toISOString().slice(0, 10); }
}
export function isCompleted(event, now = Date.now()) {
  if (event.datePending) return false;
  if (event.endAt && Number.isFinite(Date.parse(event.endAt))) return Date.parse(event.endAt) <= now;
  const date = event.localDate || (event.startAt && Number.isFinite(Date.parse(event.startAt)) ? dateInZone(new Date(event.startAt), event.timezone) : null);
  return /^\d{4}-\d{2}-\d{2}$/.test(date || '') ? dateInZone(new Date(now), event.timezone) > date : false;
}
