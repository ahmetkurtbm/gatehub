"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const [loading, setLoading] = useState(false);

  return (
    <button
      className="secondary-button"
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await authClient.signOut({
          fetchOptions: {
            onSuccess: () => {
              window.location.href = "/login";
            },
          },
        });
      }}
    >
      {loading ? "Çıkış yapılıyor…" : "Çıkış yap"}
    </button>
  );
}
