/** @type {import('next').NextConfig} */
const nextConfig = {
  // No allowedOrigins override — Next.js defaults to same-origin only for server actions.
  // Do NOT add allowedOrigins: ["*"] as that enables CSRF on all server actions.
};

export default nextConfig;
