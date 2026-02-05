/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'output: export' to allow Vercel to handle dynamic routes properly
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
