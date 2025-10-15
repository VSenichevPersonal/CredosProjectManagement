"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Кеширование на 5 минут
            staleTime: 5 * 60 * 1000,
            // Данные остаются в кеше 10 минут после неиспользования
            gcTime: 10 * 60 * 1000,
            // Повторный запрос при фокусе окна
            refetchOnWindowFocus: true,
            // Повторный запрос при переподключении
            refetchOnReconnect: true,
            // Количество повторных попыток при ошибке
            retry: 1,
            // Интервал между повторными попытками
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            // Повторные попытки для мутаций
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools только в development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}

