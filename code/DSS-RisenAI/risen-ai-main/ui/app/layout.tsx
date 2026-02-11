import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'RISEN AI - Sovereign Dashboard',
  description: 'Manage sovereign AI agents through their lifecycle journey',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="app-container">
          <Navbar />
          <main className="main-content">{children}</main>
        </div>
      </body>
    </html>
  );
}
