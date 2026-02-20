import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'VedicRoots Attendance',
    description: 'Attendance system for VedicRoots',
    manifest: '/manifest.json',
};

export const viewport: Viewport = {
    themeColor: '#000000',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

/**
 * The root layout for the entire application.
 * 
 * Applies global styles, font settings (Inter), and global providers like Toaster.
 */
export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                {children}
                <Toaster richColors position="top-center" />
            </body>
        </html>
    );
}
