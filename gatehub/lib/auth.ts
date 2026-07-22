import "server-only";

import { oauthProvider } from "@better-auth/oauth-provider";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { admin, jwt, twoFactor } from "better-auth/plugins";
import { recordAudit } from "@/lib/audit";
import { registerLoginDevice } from "@/lib/device-security";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email";
import { archivePassword, assertPasswordNotReused } from "@/lib/password-history";
import { prisma } from "@/lib/prisma";

const googleConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);

const adminUserIds = (process.env.ADMIN_USER_IDS ?? "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

const trustedOrigins = (process.env.TRUSTED_ORIGINS ?? "http://localhost:3000,http://localhost:3001")
  .split(",").map((origin) => origin.trim()).filter(Boolean);

function authSecret() {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (process.env.NODE_ENV === "production" && !secret) throw new Error("BETTER_AUTH_SECRET production ortamında zorunludur.");
  return secret ?? "gatehub-development-secret-change-before-production";
}

function assertStrongPassword(password: unknown) {
  if (
    typeof password !== "string" ||
    password.length < 12 ||
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/\d/.test(password)
  ) {
    throw new APIError("BAD_REQUEST", {
      message:
        "Parola en az 12 karakter olmalı; büyük harf, küçük harf ve rakam içermelidir.",
    });
  }
}

export const auth = betterAuth({
  appName: "GateHub",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: authSecret(),
  trustedOrigins,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  disabledPaths: ["/token"],
  user: {
    deleteUser: { enabled: true },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail(user.email, user.name, url);
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail(user.email, user.name, url);
    },
  },
  socialProviders: googleConfigured
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          prompt: "select_account",
        },
      }
    : undefined,
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
      allowDifferentEmails: false,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 300, max: 5 },
      "/request-password-reset": { window: 300, max: 3 },
      "/reset-password": { window: 300, max: 5 },
    },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    cookiePrefix: "gatehub",
  },
  databaseHooks: {
    session: {
      create: {
        after: async (session) => {
          try { await registerLoginDevice(session); } catch (error) { console.error("Cihaz kaydı oluşturulamadı:", error); }
        },
      },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (["/sign-up/email", "/reset-password", "/change-password", "/set-password"].includes(ctx.path)) {
        const body = ctx.body as Record<string, unknown> | undefined;
        assertStrongPassword(body?.password ?? body?.newPassword);
      }
      if (ctx.path === "/reset-password") {
        const body = ctx.body as { token?: string; newPassword?: string } | undefined;
        if (body?.token && body.newPassword) {
          const verification = await prisma.verification.findFirst({ where: { identifier: `reset-password:${body.token}` } });
          if (verification) {
            const previousHash = await assertPasswordNotReused(verification.value, body.newPassword);
            await archivePassword(verification.value, previousHash);
          }
        }
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      const actionByPath: Record<string, string> = {
        "/sign-in/email": "auth.login.email",
        "/sign-in/social": "auth.login.social",
        "/sign-up/email": "auth.register",
        "/verify-email": "auth.email.verified",
        "/reset-password": "auth.password.reset",
      };
      const action = actionByPath[ctx.path];
      if (!action) return;
      await recordAudit({
        action,
        userId: ctx.context.newSession?.user.id,
        ipAddress: ctx.request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
        userAgent: ctx.request?.headers.get("user-agent") ?? undefined,
      });
    }),
  },
  plugins: [
    admin({ defaultRole: "user", adminRoles: ["admin"], adminUserIds }),
    twoFactor({ issuer: "GateHub", allowPasswordless: true, accountLockout: { enabled: true, maxFailedAttempts: 5, durationSeconds: 900 } }),
    jwt(),
    oauthProvider({
      loginPage: "/login",
      consentPage: "/consent",
      selectAccount: {
        page: "/login",
        shouldRedirect: () => true,
      },
      scopes: ["openid", "profile", "email", "offline_access"],
      pairwiseSecret: authSecret(),
      silenceWarnings: { oauthAuthServerConfig: true },
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;

export function isGoogleConfigured() {
  return googleConfigured;
}

export function isAdminUser(user: { id: string; role?: string | null }) {
  return user.role === "admin" || adminUserIds.includes(user.id);
}
