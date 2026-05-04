import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Software-14 | منصة المجتمع والأكاديمية",
  description: "منصة تفاعلية اجتماعية وأكاديمية لدفعه Software-14. شارك الذكريات، العب ألعاب الذكاء الاصطناعي، وصل إلى المصادر الأكاديمية والمزيد.",
  keywords: ["Software-14", "كلية", "أكاديمية", "مجتمع", "ألعاب ذكاء اصطناعي"],
  authors: [{ name: "فريق Software-14" }],
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${cairo.variable} antialiased bg-background text-foreground font-[family-name:var(--font-cairo)]`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="software-14-theme"
        >
          <AuthProvider>
            {children}
            <Toaster richColors position="bottom-left" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
