/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // <-- CRUCIAL: Tells Next.js to generate an 'out' folder filled with static files
  typescript: {
    ignoreBuildErrors: true, 
  }
};

export default nextConfig;
