import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Inter, JetBrains_Mono } from 'next/font/google';
import { BRAND } from '@/lib/brand';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: `${BRAND.name} — ${BRAND.tagline}`,
  description: BRAND.description,
  applicationName: BRAND.name,
  openGraph: {
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.description,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.description,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0b090c' },
    { media: '(prefers-color-scheme: light)', color: '#f7f2ec' },
  ],
  colorScheme: 'dark light',
};

// Apply the saved theme before first paint so light-mode users never see a dark flash.
const themeBootScript = `(function(){try{var t=localStorage.getItem('noir-edit-theme');if(!t){var r=localStorage.getItem('velvet-friday-guest-v2');t=r&&JSON.parse(r).theme;}if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className={`${inter.variable} ${cormorant.variable} ${jetbrainsMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
