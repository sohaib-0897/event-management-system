export const rawEvent = {
  id: 'demo-event',
  name: 'The Midnight — Live',
  url: 'https://www.ticketmaster.com/demo-event',
  images: [],
  dates: {
    start: { dateTime: '2030-06-15T19:00:00Z', localDate: '2030-06-15', localTime: '20:00:00' },
    timezone: 'Europe/London',
    status: { code: 'onsale' },
  },
  classifications: [
    { primary: true, segment: { id: 'music', name: 'Music' }, genre: { name: 'Indie' } },
  ],
  priceRanges: [{ min: 25, max: 65, currency: 'GBP' }],
  _embedded: {
    venues: [
      { name: 'The Roundhouse', city: { name: 'London' }, country: { name: 'United Kingdom' } },
    ],
  },
};
export const searchResponse = {
  _embedded: { events: [rawEvent] },
  page: { number: 0, size: 20, totalElements: 1, totalPages: 1 },
};
