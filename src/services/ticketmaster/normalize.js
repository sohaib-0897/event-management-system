export function normalizeEvent(raw = {}) {
  const venue = raw._embedded?.venues?.[0];
  const start = raw.dates?.start || {};
  const images = (raw.images || []).filter((image) => /^https:\/\//.test(image.url || ''));
  const image = [...images].sort((a, b) => (a.ratio === '16_9' ? 0 : 1) - (b.ratio === '16_9' ? 0 : 1) || Math.abs((a.width || 0) - 700) - Math.abs((b.width || 0) - 700))[0];
  const price = raw.priceRanges?.[0];
  const classification = raw.classifications?.find((item) => item.primary) || raw.classifications?.[0];
  const pendingDate = Boolean(start.dateTBA || start.dateTBD);
  return {
    id: String(raw.id || ''), name: raw.name || 'Untitled event',
    image: image?.url || '/event-placeholder.svg', imageAttribution: image?.attribution || '',
    venue: venue?.name || 'Venue to be announced', city: venue?.city?.name || '',
    address: [venue?.address?.line1, venue?.city?.name, venue?.state?.stateCode, venue?.country?.name].filter(Boolean).join(', '),
    category: classification?.segment?.name || 'Other', genre: classification?.genre?.name || '',
    startAt: !pendingDate && start.dateTime && Number.isFinite(Date.parse(start.dateTime)) ? start.dateTime : null,
    endAt: raw.dates?.end?.dateTime && Number.isFinite(Date.parse(raw.dates.end.dateTime)) ? raw.dates.end.dateTime : null,
    localDate: !pendingDate ? start.localDate || null : null,
    localTime: !pendingDate && !start.timeTBA && !start.noSpecificTime ? start.localTime || null : null,
    timezone: raw.dates?.timezone || venue?.timezone || null,
    datePending: pendingDate, timePending: Boolean(start.timeTBA || start.noSpecificTime),
    status: raw.dates?.status?.code || 'unknown',
    price: price && Number.isFinite(price.min) && Number.isFinite(price.max) ? { min: price.min, max: price.max, currency: price.currency || 'USD' } : null,
    ticketUrl: /^https:\/\//.test(raw.url || '') ? raw.url : null,
    description: raw.info || raw.description || '', note: raw.pleaseNote || '',
  };
}
export function normalizeSearch(raw = {}) {
  return { events: (raw._embedded?.events || []).map(normalizeEvent).filter((event) => event.id),
    page: { number: Number(raw.page?.number) || 0, size: Number(raw.page?.size) || 20, totalElements: Number(raw.page?.totalElements) || 0, totalPages: Number(raw.page?.totalPages) || 0 },
  };
}
