/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, // Re-enable React Strict Mode
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Remove CSP headers from here - handled in middleware.ts
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