/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Allows production builds to successfully complete even if
    // your project has TypeScript type-checking errors.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
