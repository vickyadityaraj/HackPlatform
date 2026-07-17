/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@radix-ui/react-dialog",
      "@radix-ui/react-tabs",
      "@radix-ui/react-select",
      "@radix-ui/react-label",
      "@radix-ui/react-slot",
      "@radix-ui/react-toast",
      "@radix-ui/react-dropdown-menu"
    ],
  },
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.devtool = "eval-cheap-module-source-map";
    }
    return config;
  },
};

export default nextConfig;
