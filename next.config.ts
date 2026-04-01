import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "onemg.gumlet.io",
      },
      {
        protocol: "https",
        hostname: "pharmeasy.in",
      },
    ],
  },
};

export default nextConfig;
