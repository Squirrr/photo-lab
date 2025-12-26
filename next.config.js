/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/photo-lab',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
}

module.exports = nextConfig

