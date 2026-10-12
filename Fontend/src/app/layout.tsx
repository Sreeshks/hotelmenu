import type { Metadata, Viewport } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ToastProvider } from "@/components/common/Toast";
import { WebSocketProvider } from "@/components/providers/WebSocketProvider";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Grand Hotel & Dining | Digital Culinary Menu",
  description: "Exquisite dining selections, artisanal recipes, and digital hospitality menu",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${plusJakarta.variable} scroll-smooth`}>
      <body className="min-h-screen font-sans bg-[#F8F7F3] text-[#17201B] antialiased selection:bg-brand-900 selection:text-gold-300">
        <QueryProvider>
          <ToastProvider>
            <WebSocketProvider>
              {children}
            </WebSocketProvider>
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
