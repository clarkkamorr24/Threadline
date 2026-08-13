-- AlterTable
ALTER TABLE "users" ADD COLUMN     "signInProviders" TEXT[] DEFAULT ARRAY[]::TEXT[];

