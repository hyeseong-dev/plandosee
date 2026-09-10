-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "priority" TEXT NOT NULL,
    "successCriteria" TEXT NOT NULL,
    "estimatedSeconds" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanRevision" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "priority" TEXT NOT NULL,
    "successCriteria" TEXT NOT NULL,
    "estimatedSeconds" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Todo" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "dueDate" DATE,
    "priority" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "estimatedSeconds" INTEGER NOT NULL DEFAULT 0,
    "completionCycle" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Todo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutionLog" (
    "id" TEXT NOT NULL,
    "todoId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "actualSeconds" INTEGER NOT NULL,
    "blockedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExecutionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompletionEvent" (
    "id" TEXT NOT NULL,
    "todoId" TEXT NOT NULL,
    "cycle" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompletionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "reflection" TEXT NOT NULL DEFAULT '',
    "improvement" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImprovementTransfer" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "targetPlanId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImprovementTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanRevision_planId_idx" ON "PlanRevision"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanRevision_planId_version_key" ON "PlanRevision"("planId", "version");

-- CreateIndex
CREATE INDEX "Todo_planId_deletedAt_idx" ON "Todo"("planId", "deletedAt");

-- CreateIndex
CREATE INDEX "Todo_status_dueDate_idx" ON "Todo"("status", "dueDate");

-- CreateIndex
CREATE INDEX "ExecutionLog_todoId_idx" ON "ExecutionLog"("todoId");

-- CreateIndex
CREATE INDEX "CompletionEvent_todoId_idx" ON "CompletionEvent"("todoId");

-- CreateIndex
CREATE UNIQUE INDEX "CompletionEvent_todoId_cycle_key" ON "CompletionEvent"("todoId", "cycle");

-- CreateIndex
CREATE UNIQUE INDEX "Review_planId_key" ON "Review"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "ImprovementTransfer_reviewId_key" ON "ImprovementTransfer"("reviewId");

-- CreateIndex
CREATE INDEX "ImprovementTransfer_targetPlanId_idx" ON "ImprovementTransfer"("targetPlanId");

-- AddForeignKey
ALTER TABLE "PlanRevision" ADD CONSTRAINT "PlanRevision_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Todo" ADD CONSTRAINT "Todo_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutionLog" ADD CONSTRAINT "ExecutionLog_todoId_fkey" FOREIGN KEY ("todoId") REFERENCES "Todo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompletionEvent" ADD CONSTRAINT "CompletionEvent_todoId_fkey" FOREIGN KEY ("todoId") REFERENCES "Todo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImprovementTransfer" ADD CONSTRAINT "ImprovementTransfer_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImprovementTransfer" ADD CONSTRAINT "ImprovementTransfer_targetPlanId_fkey" FOREIGN KEY ("targetPlanId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
