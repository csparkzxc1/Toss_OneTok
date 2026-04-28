import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Granite } from '@granite-js/react-native';
import { ToastProvider } from '@/components';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
    mutations: { retry: 0 },
  },
});

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <Granite />
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
