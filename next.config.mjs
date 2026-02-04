/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Exclude problematic packages from bundling
  // docusign-esign uses AMD modules incompatible with Turbopack
  // @prisma/client + prisma: avoid "Can't resolve '@prisma/client-runtime-utils'" with pnpm/Turbopack
  serverExternalPackages: [
    "docusign-esign",
    "@prisma/client",
    "@prisma/adapter-pg",
    "@prisma/client-runtime-utils",
    "prisma",
    "pg",
  ],
};

export default nextConfig;
