import "server-only";

import { oauthProvider } from "@better-auth/oauth-provider";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { jwt } from "better-auth/plugins";
import { prisma } from "@/lib/prisma";

const googleConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);

export const auth = betterAuth({
  appName: "GateHub",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret:
    process.env.BETTER_AUTH_SECRET ??
    "gatehub-development-secret-change-before-production",
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  disabledPaths: ["/token"],
  socialProviders: googleConfigured
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
      }
    : undefined,
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  plugins: [
    jwt(),
    oauthProvider({
      loginPage: "/login",
      consentPage: "/consent",
      scopes: ["openid", "profile", "email", "offline_access"],
      pairwiseSecret:
        process.env.BETTER_AUTH_SECRET ??
        "gatehub-development-secret-change-before-production",
      silenceWarnings: {
        oauthAuthServerConfig: true,
      },
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;

export function isGoogleConfigured() {
  return googleConfigured;
}
