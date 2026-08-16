-- CreateTable
CREATE TABLE "admin_notification_states" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_notification_states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_notification_states_userId_dismissedAt_idx" ON "admin_notification_states"("userId", "dismissedAt");

-- CreateIndex
CREATE UNIQUE INDEX "admin_notification_states_userId_key_key" ON "admin_notification_states"("userId", "key");

-- AddForeignKey
ALTER TABLE "admin_notification_states" ADD CONSTRAINT "admin_notification_states_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

