import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The window TV and local browser use 127.0.0.1, which is a different
  // dev origin from localhost. Without this, client scripts never load.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
