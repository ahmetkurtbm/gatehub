import "server-only";

import { prisma } from "@/lib/prisma";

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
    await prisma.auditLog.create({
      data: {
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        user: input.userId ? { connect: { id: input.userId } } : undefined,
      },
    });
  } catch (error) {
    console.error("Audit kaydı oluşturulamadı:", error);
  }
}
