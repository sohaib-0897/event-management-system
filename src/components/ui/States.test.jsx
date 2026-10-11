import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { userEvent } from '@testing-library/user-event';
import { Loading, Empty, ErrorState } from './States';

describe('request states', () => {
  it('announces loading accessibly', () => {
    render(<Loading />);
    expect(screen.getByRole('status')).toHaveTextContent('Finding your next experience');
  });
  it('provides an actionable retry after errors', async () => {
    const retry = vi.fn();
    render(<ErrorState message="Connection unavailable" retry={retry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Connection unavailable');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledOnce();
  });
  it('shows empty-state guidance', () => {
    render(<Empty title="No results">Try another city.</Empty>);
    expect(screen.getByText('Try another city.')).toBeInTheDocument();
  });
});
