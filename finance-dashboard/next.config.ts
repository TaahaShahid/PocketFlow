import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    
    // In local development, the backend runs on port 8000 and has no Nginx proxy prefixing /api.
    // In production, the backend is behind Nginx proxying via /api/.
    let destination: string;
    if (backendUrl.includes("localhost") || backendUrl.includes("127.0.0.1")) {
      // Local development: map /api/:path* to http://localhost:8000/:path* (strip /api)
      destination = `${backendUrl.replace(/\/api\/?$/, "")}/:path*`;
    } else {
      // Production: map /api/:path* to http://<IP>/api/:path* (keep /api)
      const base = backendUrl.endsWith("/api") || backendUrl.endsWith("/api/")
        ? backendUrl
        : `${backendUrl}/api`;
      destination = `${base.replace(/\/$/, "")}/:path*`;
    }

    return [
      {
        source: "/api/:path*",
        destination: destination,
      },
    ];
  },
};

export default nextConfig;