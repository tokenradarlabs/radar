/*
  Warnings:

  - Added the required column `updatedAt` to the `ApiKey` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- First add the column with a default value for existing records
ALTER TABLE "ApiKey" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Update existing records to use createdAt as updatedAt
UPDATE "ApiKey" SET "updatedAt" = "createdAt" WHERE "updatedAt" = CURRENT_TIMESTAMP;

-- Remove the default constraint
ALTER TABLE "ApiKey" ALTER COLUMN "updatedAt" DROP DEFAULT;
