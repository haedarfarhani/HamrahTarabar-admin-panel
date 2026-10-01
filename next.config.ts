import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/dashboard/products', destination: '/dashboard/cargos', permanent: false },
      { source: '/dashboard/products/:path*', destination: '/dashboard/cargos/:path*', permanent: false },
      { source: '/dashboard/cargo-review', destination: '/dashboard/cargos', permanent: false },
      { source: '/dashboard/cargo-review/:path*', destination: '/dashboard/cargos/:path*', permanent: false },
    ];
  },
};

export default nextConfig;
