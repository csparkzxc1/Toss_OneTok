import { ToastProvider } from '@/components';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const granite = require('@granite-js/react-native') as { Granite?: unknown };

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
    mutations: { retry: 0 },
  },
});

// Granite v1.x는 page 기반 자동 라우팅. Granite 컴포넌트가 export 형태가 변할 수 있어
// 동적 require로 흡수.
function GraniteRoot() {
  const G = granite.Granite as React.ComponentType<unknown> | undefined;
  if (!G) return null;
  return <G />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <GraniteRoot />
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
