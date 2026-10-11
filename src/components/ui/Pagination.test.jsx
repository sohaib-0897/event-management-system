import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Pagination } from './Pagination';

describe('pagination boundaries', () => {
  it('prevents navigating before the first page', async () => {
    const change = vi.fn(); render(<Pagination page={0} totalPages={3} onChange={change} />);
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(change).toHaveBeenCalledWith(1);
  });
  it('caps navigation at the API deep-paging boundary', () => {
    render(<Pagination page={49} totalPages={120} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    expect(screen.getByText('Page 50 of 50')).toBeInTheDocument();
    expect(screen.getByText(/Narrow your filters/)).toBeInTheDocument();
  });
});
