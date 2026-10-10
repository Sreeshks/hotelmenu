import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ToastProvider } from "@/components/common/Toast";
import { WebSocketProvider } from "@/components/providers/WebSocketProvider";
import { SettingsProvider } from "@/components/providers/SettingsProvider";

export const metadata: Metadata = {
  title: "Grand Hotel & Dining | Admin Portal",
  description: "Executive Management Portal for Digital Menus, Waitstaff, and Dining Feedback",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 font-sans antialiased text-stone-900 selection:bg-brand-900 selection:text-gold-300">
        <QueryProvider>
          <ToastProvider>
            <AuthProvider>
              <WebSocketProvider>
                <SettingsProvider>
                  {children}
                </SettingsProvider>
              </WebSocketProvider>
            </AuthProvider>
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
