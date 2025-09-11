/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // The 'swcMinify: true' option is no longer needed and should be removed.
  // swcMinify: true, 
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "react",
      "react-dom",
      "@radix-ui/react-accordion",
      // ... (all your other imports)
      "@radix-ui/react-tooltip"
    ],
  },
  async rewrites() {
    return [
      {
        source: '/webhook-test/:path*',
        destination: 'https://knowme2.app.n8n.cloud/webhook-test/:path*',
      },
    ];
  },
};

export default nextConfig;