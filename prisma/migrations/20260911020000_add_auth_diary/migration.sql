-- Add owner relation to the existing T06 plans. Existing rows stay unclaimed
-- until the first account signs up, when the application claims them atomically.
ALTER TABLE "Plan" ADD COLUMN "userId" TEXT;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "passwordChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiaryStudy" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "missingRule" TEXT NOT NULL,
    "duplicateRule" TEXT NOT NULL,
    "outlierRule" TEXT NOT NULL,
    "roundingRule" TEXT NOT NULL,
    "weekStartsOn" TEXT NOT NULL DEFAULT 'MONDAY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DiaryStudy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiaryEntry" (
    "id" TEXT NOT NULL,
    "studyId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DiaryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiaryRuleChange" (
    "id" TEXT NOT NULL,
    "studyId" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "beforeRule" TEXT NOT NULL,
    "afterRule" TEXT NOT NULL,
    "sourceEntryIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DiaryRuleChange_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");
CREATE INDEX "Plan_userId_idx" ON "Plan"("userId");
CREATE UNIQUE INDEX "DiaryStudy_userId_key" ON "DiaryStudy"("userId");
CREATE UNIQUE INDEX "DiaryEntry_studyId_date_key" ON "DiaryEntry"("studyId", "date");
CREATE INDEX "DiaryEntry_studyId_date_idx" ON "DiaryEntry"("studyId", "date");
CREATE UNIQUE INDEX "DiaryRuleChange_studyId_key" ON "DiaryRuleChange"("studyId");

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DiaryStudy" ADD CONSTRAINT "DiaryStudy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DiaryEntry" ADD CONSTRAINT "DiaryEntry_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "DiaryStudy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DiaryRuleChange" ADD CONSTRAINT "DiaryRuleChange_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "DiaryStudy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
