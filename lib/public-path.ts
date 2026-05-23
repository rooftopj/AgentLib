export function publicPath(src: string) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  if (!src || !src.startsWith("/") || src.startsWith("//")) return src;
  if (!basePath || src === basePath || src.startsWith(`${basePath}/`)) return src;
  return `${basePath}${src}`;
}
