import type { NextConfig } from 'next';

const isStaticExport = process.env.NEXT_EXPORT_STATIC === '1';

const nextConfig: NextConfig = {
  ...(isStaticExport
    ? {
        output: 'export',
        basePath: '/blackfriday',
        assetPrefix: '/blackfriday/',
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
