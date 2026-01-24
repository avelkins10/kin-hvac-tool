/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Exclude problematic packages from bundling
  // docusign-esign uses AMD modules incompatible with Turbopack
  serverExternalPackages: ['docusign-esign'],
  // Ensure Prisma Client is transpiled and bundled correctly
  transpilePackages: ['@prisma/client'],
}

export default nextConfig
