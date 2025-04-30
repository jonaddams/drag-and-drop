import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nutrient.io Web SDK Drag and Drop Example',
  description: 'A simple drag and drop example using the Nutrient.io Web SDK',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <head>
        <link rel='preconnect' href='https://cdn.cloud.pspdfkit.com' />
        <Script src='https://cdn.cloud.pspdfkit.com/pspdfkit-web@1.2.0/nutrient-viewer.js' strategy='beforeInteractive' />
      </head>
      <body>{children}</body>
    </html>
  );
}
