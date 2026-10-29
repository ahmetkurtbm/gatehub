import type { NextConfig } from "next";
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];
const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  // Demo mode reads the migrations and the PGlite WASM at runtime.
  outputFileTracingIncludes: {
    "/**/*": ["./db/migrations/*.sql", "./node_modules/@electric-sql/pglite/dist/{pglite.wasm,pglite.data,initdb.wasm}"],
  },
  async headers(){return [{source:"/(.*)",headers:securityHeaders}]},
};
export default nextConfig;
