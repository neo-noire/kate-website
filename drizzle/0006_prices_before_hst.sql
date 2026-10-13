-- Tier prices are now stored before HST; the site adds 13% on top.
-- Undoes 0005, which had raised them to HST-inclusive whole-dollar amounts
-- (44 / 101 / 247 back to 39 / 89 / 219).
UPDATE "tier" SET "price_cents" = round("price_cents" / 1.13 / 100) * 100, "updated_at" = now();
