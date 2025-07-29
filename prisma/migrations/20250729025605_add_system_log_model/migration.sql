-- CreateTable
CREATE TABLE "system_logs" (
    "id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "metadata" TEXT,
    "requestId" TEXT,
    "duration" INTEGER,
    "errorStack" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "system_logs_level_idx" ON "system_logs"("level");

-- CreateIndex
CREATE INDEX "system_logs_category_idx" ON "system_logs"("category");

-- CreateIndex
CREATE INDEX "system_logs_userId_idx" ON "system_logs"("userId");

-- CreateIndex
CREATE INDEX "system_logs_timestamp_idx" ON "system_logs"("timestamp");

-- CreateIndex
CREATE INDEX "system_logs_requestId_idx" ON "system_logs"("requestId");
