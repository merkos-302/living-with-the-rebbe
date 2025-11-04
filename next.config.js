/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // App Router is enabled by default in Next.js 15
  // No need to explicitly configure it

  // Configure headers for iframe deployment
  async headers() {
    // Determine if we're in development mode
    const isDev = process.env.NODE_ENV === 'development';

    // Build frame-ancestors directive based on environment
    // In development, we need to allow both apex domains and subdomains
    // since localhost is embedded in the actual chabaduniverse.com site
    const frameAncestors = isDev
      ? "frame-ancestors 'self' http://localhost:* http://127.0.0.1:* https://chabaduniverse.com https://*.chabaduniverse.com https://valu.social https://*.valu.social http://chabaduniverse.com http://*.chabaduniverse.com"
      : "frame-ancestors 'self' https://chabaduniverse.com https://*.chabaduniverse.com https://valu.social https://*.valu.social";

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
            // Content Security Policy for iframe embedding
            key: 'Content-Security-Policy',
            value: frameAncestors + ';',
          },
          {
            // Enable CORS for API routes (allow all origins for iframe compatibility)
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With',
          },
          {
            // Allow credentials for iframe authentication
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
        ],
      },
    ];
  },

  // Image optimization configuration
  // Since we download and cache media locally, we don't need external patterns
  images: {
    remotePatterns: [],
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
