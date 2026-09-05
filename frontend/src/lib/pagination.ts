import type { TablePaginationConfig } from 'antd';

import type { PageResponse } from '../types/api';

export interface PageQuery {
  page: number;
  size: number;
}

/** Matches the backend default; the backend caps `size` at 100. */
export const DEFAULT_PAGE_QUERY: PageQuery = { page: 0, size: 20 };

/**
 * The backend page index is 0-based (Spring's Page.getNumber()), while Ant Design's
 * `current` is 1-based. Converting in one place keeps the off-by-one out of every screen.
 */
export function toTablePagination<T>(
  page: PageResponse<T> | undefined,
  query: PageQuery,
): TablePaginationConfig {
  return {
    current: (page?.page ?? query.page) + 1,
    pageSize: page?.size ?? query.size,
    total: page?.totalElements ?? 0,
    showSizeChanger: true,
    pageSizeOptions: [10, 20, 50, 100],
    showTotal: (total) => `${total} kết quả`,
  };
}

/** Inverse of toTablePagination, for Table's onChange handler. */
export function fromTablePagination(
  pagination: TablePaginationConfig,
  fallback: PageQuery = DEFAULT_PAGE_QUERY,
): PageQuery {
  return {
    page: (pagination.current ?? 1) - 1,
    size: pagination.pageSize ?? fallback.size,
  };
}
