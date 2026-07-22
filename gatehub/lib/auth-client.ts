"use client";

import { oauthProviderClient } from "@better-auth/oauth-provider/client";
import { createAuthClient } from "better-auth/react";
import { adminClient, twoFactorClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [adminClient(), twoFactorClient({ twoFactorPage: "/two-factor" }), oauthProviderClient()],
});
