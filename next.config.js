/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["revolt-nodejs-bindings"],
  experimental: {
    reactCompiler: true,
  },
  webpack: (config, { dev, isServer, webpack, nextRuntime }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push("revolt-nodejs-bindings");
    }
    config.module.rules.push({
      test: /\.node$/,
      use: [
        {
          loader: "nextjs-node-loader",
          options: {
            // flags: os.constants.dlopen.RTLD_NOW,
            outputPath: config.output.path,
          },
        },
      ],
    });
    return config;
  },
};

module.exports = nextConfig;
