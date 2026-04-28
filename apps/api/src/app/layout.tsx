export const metadata = {
  title: '한줄톡 API',
  description: 'Backend for Hanjul-Tok mini app',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
