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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('hotel_admin_theme') || JSON.parse(localStorage.getItem('hotel_admin_settings') || '{}').theme;
                  var isDark = stored === 'dark' || (stored === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-stone-50 dark:bg-[#090c0b] font-sans antialiased text-stone-900 dark:text-stone-100 selection:bg-brand-900 selection:text-gold-300 transition-colors duration-200">
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
