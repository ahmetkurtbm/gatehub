import "server-only";

import { randomUUID } from "node:crypto";
import { query } from "@/lib/db";

type AuditInput = {
  action: string;
  userId?: string;
  targetType?: string;
  targetId?: string;
  ipAddress?: string;
  userAgent?: string;
};

export async function recordAudit(input: AuditInput) {
  try {
    await query(
      `insert into "auditLog" ("id", "action", "userId", "targetType", "targetId", "ipAddress", "userAgent") values ($1, $2, $3, $4, $5, $6, $7)`,
      [randomUUID(), input.action, input.userId ?? null, input.targetType ?? null, input.targetId ?? null, input.ipAddress ?? null, input.userAgent ?? null],
    );
  } catch (error) {
    console.error("Audit kaydı oluşturulamadı:", error);
  }
}
