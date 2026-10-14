/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  experimental: {
    // Các gói chỉ chạy phía server (cơ sở dữ liệu, email, push) không cần webpack đóng gói lại.
    serverComponentsExternalPackages: ['node:sqlite', 'pg', 'resend', 'web-push'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // node:sqlite là module có sẵn của Node 22+ — không cho bundler cố phân giải nó.
      config.externals = [...(config.externals || []), 'node:sqlite', 'pg', 'resend', 'web-push'];
    }
    return config;
  },
};

export default nextConfig;
