/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: the demo is a self-contained `out/` directory (no backend
  // required). The optional FastAPI backend lives in ../backend for the full
  // version and is reached at build time via NEXT_PUBLIC_API_URL.
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
