
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
    API_URL: process.env.NODE_ENV === 'production' 
      ? 'https://api.production-url.com'  // Replace with your production API URL
      : process.env.NEXT_PUBLIC_API_URL,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig
