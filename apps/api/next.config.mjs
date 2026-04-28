/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@hanjul-tok/shared', '@hanjul-tok/prompts'],
  experimental: {
    typedRoutes: false,
  },
};

export default nextConfig;
