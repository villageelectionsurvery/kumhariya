/** @type {import('next').NextConfig} */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

// Static export: `npm run build` writes plain HTML/CSS/JS to out/, so the site
// needs no server. On GitHub Pages it lives under /kumhariya (set in the
// deploy workflow).
export default {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
};
