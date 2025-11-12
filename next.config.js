/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // SWC minification disabled - will re-enable after Next.js 13+ upgrade
  swcMinify: false,
  experimental: {
    forceSwcTransforms: false,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@swc/helpers/_/_class_private_field_get': '@swc/helpers/esm/_class_private_field_get',
      '@swc/helpers/_/_class_private_field_set': '@swc/helpers/esm/_class_private_field_set',
    };
    return config;
  },
  images: {
    domains: ['res.cloudinary.com'],
  },
  staticPageGenerationTimeout: 1000,
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  i18n: {
    locales: ["de-DE"],
    defaultLocale: "de-DE",
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NODE_ENV === 'production'
      ? 'https://api.bishl.de' : process.env.NEXT_PUBLIC_API_URL,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' " + process.env.NEXT_PUBLIC_API_URL,
              "frame-ancestors 'self'",
            ].join('; ')
          }
        ],
      },
    ];
  },
}

module.exports = nextConfig