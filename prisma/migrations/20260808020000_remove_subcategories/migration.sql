-- DropForeignKey
ALTER TABLE "categories" DROP CONSTRAINT "categories_parentId_fkey";

-- DropIndex
DROP INDEX "categories_parentId_idx";

-- AlterTable
ALTER TABLE "categories" DROP COLUMN "parentId";

