import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'MemoryVerse',
  description: 'An immersive, interactive space where memories feel alive.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning className="font-sans antialiased bg-slate-950 text-white" style={{ backgroundColor: '#020617' }}>{children}</body>
    </html>
  );
}


