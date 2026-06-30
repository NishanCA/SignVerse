import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "../context/LanguageContext";
import { BackendStatusProvider } from "../context/BackendStatusContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SignVerse",
  description: "AI-powered sign language assistance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('appTheme') || 'light';
                document.documentElement.setAttribute('data-theme', theme);
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className={`${inter.className} min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased`}>
        <BackendStatusProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </BackendStatusProvider>
      </body>
    </html>
  );
}
