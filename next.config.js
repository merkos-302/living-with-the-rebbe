/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // App Router is enabled by default in Next.js 15
  // No need to explicitly configure it

  // Configure headers for iframe deployment
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            // Allow iframe embedding from ChabadUniverse/Valu Social
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          {
            // Alternative modern approach to X-Frame-Options
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://*.chabaduniverse.com https://*.valu.social;",
          },
          {
            // Enable CORS for API routes
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },

  // Image optimization configuration for external sources
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'merkos-living.s3.us-west-2.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '*.merkos302.com',
      },
      {
        protocol: 'https',
        hostname: '*.chabaduniverse.com',
      },
    ],
  },

  // Webpack configuration for Hebrew/RTL support and Node.js modules
  webpack: (config, { isServer }) => {
    // Add support for Hebrew fonts and RTL
    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|otf)$/i,
      type: 'asset/resource',
    });

    // Handle MongoDB native modules on client side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
      };
    }

    return config;
  },

  // Environment variables that should be available on the client
  env: {
    NEXT_PUBLIC_CHABAD_UNIVERSE_URL: process.env.NEXT_PUBLIC_CHABAD_UNIVERSE_URL,
  },

  // Experimental features (Next.js 15)
  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  // Compiler options
  compiler: {
    // Remove console logs in production
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error', 'warn'],
          }
        : false,
  },

  // Output standalone for Docker deployment
  output: 'standalone',
};

module.exports = nextConfig;
