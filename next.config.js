/** @type {import('next').NextConfig} */
const base = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];
if (process.env.NODE_ENV === "production") {
  base.push({ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" });
}
const noStore = [{ key: "Cache-Control", value: "no-store, max-age=0" }];

module.exports = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: base },
      { source: "/admin", headers: noStore },
      { source: "/admin/:path*", headers: noStore },
      { source: "/api/admin/:path*", headers: noStore },
    ];
  },
};
