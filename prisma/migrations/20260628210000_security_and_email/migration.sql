ALTER TABLE "user" ADD COLUMN "role" TEXT DEFAULT 'user', ADD COLUMN "banned" BOOLEAN DEFAULT false, ADD COLUMN "banReason" TEXT, ADD COLUMN "banExpires" TIMESTAMP(3);
ALTER TABLE "session" ADD COLUMN "impersonatedBy" TEXT;

CREATE TABLE "rateLimit" ("id" TEXT NOT NULL, "key" TEXT NOT NULL, "count" INTEGER NOT NULL, "lastRequest" BIGINT NOT NULL, CONSTRAINT "rateLimit_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "rateLimit_key_key" ON "rateLimit"("key");

CREATE TABLE "auditLog" ("id" TEXT NOT NULL, "action" TEXT NOT NULL, "userId" TEXT, "targetType" TEXT, "targetId" TEXT, "ipAddress" TEXT, "userAgent" TEXT, "metadata" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "auditLog_pkey" PRIMARY KEY ("id"));
CREATE INDEX "auditLog_userId_idx" ON "auditLog"("userId");
CREATE INDEX "auditLog_action_idx" ON "auditLog"("action");
CREATE INDEX "auditLog_createdAt_idx" ON "auditLog"("createdAt");
ALTER TABLE "auditLog" ADD CONSTRAINT "auditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
