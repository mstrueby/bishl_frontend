/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['res.cloudinary.com'],
  },
  i18n: {
    locales: ["de-DE"],
    defaultLocale: "de-DE",
  },
}

module.exports = nextConfig
