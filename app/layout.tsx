import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'IELTS AI Speaking Exam',
  description: 'Advanced free IELTS speaking test with AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-dark text-white font-sans">{children}</body>
    </html>
  );
}