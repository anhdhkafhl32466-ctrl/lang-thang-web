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
  metadataBase: new URL("https://lang-thang-web.vercel.app"),
  title: {
    default: "Lang Thang Web — Làng Nghề Hà Nội | Nền Tảng Di Sản & Du Lịch",
    template: "%s | Lang Thang Web",
  },
  description: "Lang Thang Web — Nền tảng số hóa di sản, bản đồ tương tác GIS và trợ lý AI thông minh khám phá 327 làng nghề truyền thống Thăng Long - Hà Nội.",
  keywords: [
    "lang thang web",
    "lang thang",
    "lang-thang-web",
    "lang thang web vercel",
    "làng nghề hà nội",
    "lang nghe ha noi",
    "du lịch làng nghề",
    "gốm bát tràng",
    "lụa vạn phúc",
    "hương quảng phú cầu",
    "cốm mễ trì",
    "nón chuông",
    "mây tre phú vinh",
    "di sản hà nội"
  ],
  authors: [{ name: "Lang Thang Web Team" }],
  creator: "Lang Thang Web",
  publisher: "Lang Thang Web",
  alternates: {
    canonical: "https://lang-thang-web.vercel.app",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png?v=2", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png?v=2", sizes: "16x16", type: "image/png" },
      { url: "/images/lang-thang-logo.png?v=2", type: "image/png" },
      { url: "/favicon.ico?v=2" },
    ],
    shortcut: "/favicon.ico?v=2",
    apple: "/apple-touch-icon.png?v=2",
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "https://lang-thang-web.vercel.app",
    siteName: "Lang Thang Web",
    title: "Lang Thang Web — Làng Nghề Hà Nội",
    description: "Nền tảng số hóa di sản, bản đồ tương tác GIS và trợ lý AI thông minh khám phá 327 làng nghề truyền thống Hà Nội",
    images: [
      {
        url: "/images/lang-thang-logo.png",
        width: 1024,
        height: 1024,
        alt: "Lang Thang Web Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lang Thang Web — Làng Nghề Hà Nội",
    description: "Nền tảng số hóa di sản và trợ lý AI khám phá làng nghề truyền thống Hà Nội",
    images: ["/images/lang-thang-logo.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://lang-thang-web.vercel.app/#website",
      "url": "https://lang-thang-web.vercel.app",
      "name": "Lang Thang Web",
      "alternateName": ["Lang Thang", "Lang Thang — Làng Nghề Hà Nội", "lang-thang-web", "LangThangWeb"],
      "description": "Nền tảng số hóa di sản, bản đồ tương tác GIS và trợ lý AI thông minh khám phá 327 làng nghề truyền thống Hà Nội.",
      "inLanguage": "vi-VN"
    },
    {
      "@type": "Organization",
      "@id": "https://lang-thang-web.vercel.app/#organization",
      "name": "Lang Thang Web",
      "url": "https://lang-thang-web.vercel.app",
      "logo": "https://lang-thang-web.vercel.app/images/lang-thang-logo.png",
      "slogan": "Lang Thang ghé một ngôi làng — Theo chân văn hóa, mở ngàn điều hay"
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`scroll-smooth ${beVietnamPro.variable} ${playfairDisplay.variable}`}>
      <head>
        {/* Google Schema.org JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Favicon & Browser Tab Icons */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=2" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=2" />
        <link rel="icon" href="/images/lang-thang-logo.png?v=2" type="image/png" />
        <link rel="shortcut icon" href="/favicon.ico?v=2" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=2" />

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
