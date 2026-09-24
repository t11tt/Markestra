-- CreateTable
CREATE TABLE "Generation" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "inputSnapshot" JSONB NOT NULL,
    "output" JSONB,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Generation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentVersion" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "tags" JSONB NOT NULL,
    "cta" TEXT NOT NULL,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL,
    "generationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Generation_campaignId_idx" ON "Generation"("campaignId");

-- Only one in-flight generation per campaign, so a double click joins the same task.
CREATE UNIQUE INDEX "Generation_one_running_idx" ON "Generation"("campaignId") WHERE "status" = 'running';

-- CreateIndex
CREATE INDEX "ContentVersion_campaignId_channel_idx" ON "ContentVersion"("campaignId", "channel");

-- AddForeignKey
ALTER TABLE "Generation" ADD CONSTRAINT "Generation_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentVersion" ADD CONSTRAINT "ContentVersion_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
