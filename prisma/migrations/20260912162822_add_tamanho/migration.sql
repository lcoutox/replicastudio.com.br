/*
  Warnings:

  - You are about to drop the column `formato` on the `post_gerado` table. All the data in the column will be lost.
  - Added the required column `tipo` to the `post_gerado` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TipoTemplate" AS ENUM ('foto', 'card');

-- CreateEnum
CREATE TYPE "Tamanho" AS ENUM ('feed', 'stories');

-- AlterTable
ALTER TABLE "post_gerado" DROP COLUMN "formato",
ADD COLUMN     "tamanho" "Tamanho" NOT NULL DEFAULT 'feed',
ADD COLUMN     "tipo" "TipoTemplate" NOT NULL;

-- DropEnum
DROP TYPE "FormatoPost";
