import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { Header } from '@/components/layout/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Haiti Bet — Paris sur les Grenadiers',
  description: 'La plateforme officielle de paris sportifs sur la sélection haïtienne',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body className={`${inter.className} bg-bet-dark text-white min-h-screen`}>
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1e293b', color: '#fff', border: '1px solid #334155' },
          }}
        />
      </body>
    </html>
  );
}
