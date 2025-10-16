import type { Metadata } from 'next';
import { Inter, Heebo } from 'next/font/google';
import './globals.css';

// English font
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// Hebrew font
const heebo = Heebo({
  subsets: ['hebrew'],
  variable: '--font-heebo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Living with the Rebbe - Admin Tool',
  description:
    'Admin tool for scraping and publishing Living with the Rebbe newsletters to ChabadUniverse',
  robots: 'noindex, nofollow', // Admin-only tool
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${heebo.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        {/* Provider hierarchy will be added here:
            <ValuApiProvider>
              <AuthProvider>
                {children}
              </AuthProvider>
            </ValuApiProvider>
        */}
        {children}
      </body>
    </html>
  );
}
