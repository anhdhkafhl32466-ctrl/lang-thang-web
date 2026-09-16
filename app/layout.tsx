import type { Metadata, Viewport } from "next";
import { Playfair_Display, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";

const playfairDisplay = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "Lang Thang — Làng Nghề Hà Nội | Ghé một ngôi làng, theo chân văn hóa, mở ngàn điều hay",
  description: "Lang Thang ghé một ngôi làng — Theo chân văn hóa, mở ngàn điều hay. Nền tảng di sản số và bản đồ 327 làng nghề truyền thống Hà Nội.",
  keywords: ["Lang Thang", "Làng nghề Hà Nội", "Gốm Bát Tràng", "Lụa Vạn Phúc", "Nón Chuông", "Mây tre Phú Vinh", "Du lịch Hà Nội", "Trải nghiệm làng nghề", "Đồ thủ công mỹ nghệ"],
  authors: [{ name: "Lang Thang Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`scroll-smooth ${beVietnamPro.variable} ${playfairDisplay.variable}`}>
      <head>
        {/* Preconnect and fallback for Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="font-sans antialiased bg-dopaper-50 text-lacquer-900 selection:bg-terracotta-100 selection:text-terracotta-900">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
