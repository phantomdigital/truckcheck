import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async redirects() {
    // Get domain from environment variable or use placeholder
    // Replace "YOUR_DOMAIN.com" with your actual domain
    const domain = process.env.EZOIC_ADS_TXT_DOMAIN || "YOUR_DOMAIN.com";
    const adsTxtUrl = `https://srv.adstxtmanager.com/19390/${domain}`;

    return [
      {
        source: "/ads.txt",
        destination: adsTxtUrl,
        permanent: true, // 301 redirect
      },
    ];
  },
};

export default nextConfig;
