import createMDX from "@next/mdx";

const repoBasePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: repoBasePath,
  assetPrefix: repoBasePath,
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  images: {
    unoptimized: true
  }
};

const withMDX = createMDX({
  extension: /\.mdx?$/
});

export default withMDX(nextConfig);
