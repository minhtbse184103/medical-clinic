import { describe, expect, it } from 'vitest';

import {
  DEFAULT_PAGE_QUERY,
  fromTablePagination,
  toTablePagination,
  type PageQuery,
} from './pagination';
import type { PageResponse } from '../types/api';

function page(overrides: Partial<PageResponse<string>> = {}): PageResponse<string> {
  return { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0, ...overrides };
}

describe('toTablePagination', () => {
  /** The off-by-one this helper exists to prevent: Spring is 0-based, Ant Design is 1-based. */
  it('converts the 0-based backend page to a 1-based current page', () => {
    expect(toTablePagination(page({ page: 0 }), DEFAULT_PAGE_QUERY).current).toBe(1);
    expect(toTablePagination(page({ page: 3 }), DEFAULT_PAGE_QUERY).current).toBe(4);
  });

  it('falls back to the requested page while the first response is loading', () => {
    expect(toTablePagination(undefined, { page: 2, size: 20 }).current).toBe(3);
    expect(toTablePagination(undefined, { page: 2, size: 50 }).pageSize).toBe(50);
  });

  it('reports the total element count, not the page count', () => {
    expect(toTablePagination(page({ totalElements: 42, totalPages: 3 }), DEFAULT_PAGE_QUERY).total)
      .toBe(42);
  });

  it('offers no page size above the backend maximum of 100', () => {
    const options = toTablePagination(page(), DEFAULT_PAGE_QUERY).pageSizeOptions ?? [];

    expect(options.every((size) => Number(size) <= 100)).toBe(true);
  });
});

describe('fromTablePagination', () => {
  it('converts the 1-based current page back to a 0-based page', () => {
    expect(fromTablePagination({ current: 1, pageSize: 20 })).toEqual({ page: 0, size: 20 });
    expect(fromTablePagination({ current: 4, pageSize: 20 })).toEqual({ page: 3, size: 20 });
  });

  it('keeps the previous size when the table reports none', () => {
    expect(fromTablePagination({ current: 2 }, { page: 0, size: 50 }).size).toBe(50);
  });

  it('treats a missing current page as the first one', () => {
    expect(fromTablePagination({}).page).toBe(0);
  });
});

describe('round trip', () => {
  it('returns the original query after both conversions', () => {
    const original: PageQuery = { page: 5, size: 50 };

    const roundTripped = fromTablePagination(
      toTablePagination(page({ page: original.page, size: original.size }), original),
      original,
    );

    expect(roundTripped).toEqual(original);
  });
});
