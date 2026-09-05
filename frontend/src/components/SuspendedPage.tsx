import { Flex, Spin } from 'antd';
import { Suspense, type ReactNode } from 'react';

/** Fallback for a lazily loaded page, shown while its chunk is downloading. */
export function PageLoading() {
  return (
    <Flex align="center" justify="center" style={{ minHeight: '50vh' }}>
      <Spin size="large" />
    </Flex>
  );
}

/** For routes outside AppLayout, which has no Outlet to wrap. */
export function SuspendedPage({ element }: { element: ReactNode }) {
  return <Suspense fallback={<PageLoading />}>{element}</Suspense>;
}
