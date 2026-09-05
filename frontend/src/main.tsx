import '@ant-design/v5-patch-for-react-19';
import 'antd/dist/reset.css';
import './index.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntdApp, ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

import { AuthProvider } from './auth/AuthProvider';
import { router } from './router';

dayjs.locale('vi');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // The API client already retries once after refreshing an expired token,
      // so an extra retry here would only duplicate failed requests.
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8,
          // A tinted page background so white cards read as raised surfaces.
          colorBgLayout: '#f4f6f9',
          // System fonts only: no webfont request, and these all cover Vietnamese diacritics.
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        },
        components: {
          Layout: { headerBg: '#ffffff', headerHeight: 56 },
          Card: { headerFontSize: 15 },
          Menu: { itemMarginInline: 8, itemBorderRadius: 6 },
        },
      }}
    >
      {/* AntdApp provides message/notification/modal through hooks so they inherit theme and locale. */}
      <AntdApp>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </QueryClientProvider>
      </AntdApp>
    </ConfigProvider>
  </StrictMode>,
);
