export const SORTS = {
  'relevance,desc': 'Recommended',
  'date,asc': 'Date: soonest',
  'date,desc': 'Date: latest',
  'name,asc': 'Name: A–Z',
};
export function validFilters(input = {}) {
  const date = (value) =>
    /^\d{4}-\d{2}-\d{2}$/.test(value || '') &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
      ? value
      : '';
  const size = 20;
  const page = Math.max(0, Math.min(49, Math.floor(Number(input.page) || 0)));
  const from = date(input.from);
  const to = date(input.to);
  return {
    keyword: String(input.keyword || '')
      .trim()
      .slice(0, 100),
    city: String(input.city || '')
      .trim()
      .slice(0, 100),
    country: /^[A-Za-z]{2}$/.test(input.country || '') ? input.country.toUpperCase() : '',
    category: String(input.category || '').slice(0, 100),
    from,
    to: to && (!from || to >= from) ? to : '',
    page,
    size,
    sort: SORTS[input.sort] ? input.sort : 'relevance,desc',
  };
}
export const queryKey = (filters) => JSON.stringify(validFilters(filters));
export function apiParams(filters, now = Date.now()) {
  const f = validFilters(filters);
  const start = Math.max(now, f.from ? Date.parse(`${f.from}T00:00:00Z`) : now);
  if (f.to && Date.parse(`${f.to}T23:59:59Z`) < start)
    throw new Error('Choose a date range that includes upcoming events.');
  return {
    keyword: f.keyword,
    city: f.city,
    countryCode: f.country,
    classificationId: f.category,
    startDateTime: new Date(start).toISOString().replace(/\.\d{3}Z$/, 'Z'),
    endDateTime: f.to ? `${f.to}T23:59:59Z` : '',
    includeTBA: 'yes',
    includeTBD: 'yes',
    size: f.size,
    page: f.page,
    sort: f.sort,
  };
}
