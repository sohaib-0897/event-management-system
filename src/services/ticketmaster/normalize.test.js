import { describe, it, expect } from 'vitest';
import { normalizeEvent, normalizeSearch } from './normalize';
import { rawEvent } from '../../test/fixtures/events';
import { validFilters, apiParams } from './query';

describe('normalization and filters', () => {
  it('normalizes event data and supplies honest fallbacks', () => {
    expect(normalizeEvent(rawEvent)).toMatchObject({ id: 'demo-event', venue: 'The Roundhouse', price: { min: 25, max: 65 } });
    expect(normalizeEvent({ id: 'minimal' })).toMatchObject({ image: '/event-placeholder.svg', price: null, venue: 'Venue to be announced', startAt: null });
    expect(normalizeSearch({}).events).toEqual([]);
  });
  it('does not invent a known date for TBA events', () => {
    const event = normalizeEvent({ ...rawEvent, dates: { start: { dateTBA: true, dateTime: '2030-06-15T19:00:00Z' } } });
    expect(event.startAt).toBeNull(); expect(event.localDate).toBeNull();
  });
  it('validates sorting, pagination, countries, and reversed dates', () => {
    expect(validFilters({ page: 900, sort: 'bad', country: 'us', from: '2030-06-15', to: '2030-06-01' })).toMatchObject({ page: 49, sort: 'relevance,desc', country: 'US', to: '' });
    expect(apiParams({ category: 'music' })).toMatchObject({ classificationId: 'music', size: 20 });
  });
});
