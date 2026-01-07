import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

// Cloudflare Pages support (optional - only if @cloudflare/next-on-pages is installed)
if (process.env.NODE_ENV === 'development' && typeof process !== 'undefined') {
  // Dynamically import Cloudflare dev platform setup
  import('@cloudflare/next-on-pages/next-dev')
    .then((module) => {
      if (module.setupDevPlatform) {
        module.setupDevPlatform();
      }
    })
    .catch(() => {
      // Silently ignore if @cloudflare/next-on-pages is not installed
      // This allows the app to work normally on other platforms
    });
}

export default nextConfig;
