-- CreateEnum
CREATE TYPE "Status" AS ENUM ('OPEN', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'REJECTED');

-- AlterTable
ALTER TABLE "FeatureRequest" ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'OPEN';
