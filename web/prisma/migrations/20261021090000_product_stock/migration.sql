ALTER TABLE "Product" ADD COLUMN "stock" INTEGER NOT NULL DEFAULT 100;
ALTER TABLE "Product" ADD CONSTRAINT "Product_stock_nonnegative" CHECK ("stock" >= 0);
