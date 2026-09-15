import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "Làng Nghề Hà Nội | Chạm vào truyền thống – Trải nghiệm tinh hoa",
  description: "Nền tảng du lịch trải nghiệm số và kết nối thương mại làng nghề truyền thống Hà Nội: Bát Tràng, Vạn Phúc, Phú Vinh, Chuông, Kiêu Kỵ, Đào Thục.",
  keywords: ["Làng nghề Hà Nội", "Gốm Bát Tràng", "Lụa Vạn Phúc", "Nón Chuông", "Mây tre Phú Vinh", "Du lịch Hà Nội", "Trải nghiệm làng nghề", "Đồ thủ công mỹ nghệ"],
  authors: [{ name: "Làng Nghề Hà Nội Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="scroll-smooth">
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossOrigin="" />
      </head>
      <body className={`${geistSans.variable} font-sans antialiased bg-dopaper-50 text-lacquer-900`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
