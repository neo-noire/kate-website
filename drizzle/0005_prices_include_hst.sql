-- Prices now include HST (Kate charges it from Ontario). Raise every existing tier price by 13% so
-- her earnings before tax stay the same, rounded to whole dollars.
UPDATE "tier" SET "price_cents" = round("price_cents" * 1.13 / 100) * 100, "updated_at" = now();
