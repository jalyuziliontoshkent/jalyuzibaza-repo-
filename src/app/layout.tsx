import type { Metadata } from 'next';
import './globals.css';
import { StoreProvider } from '@/lib/StoreProvider';

export const metadata: Metadata = {
  title: 'Jalyuzi ERP',
  description: 'Warehouse Blocks ERP Mini App',
  themeColor: '#2563EB',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz">
      <body>
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
