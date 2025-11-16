-- Ð?t original_price gi?ng price cho t?t c? s?n ph?m
UPDATE product
SET original_price = price;

-- Ch? gi? gi?m giá cho m?t s? s?n ph?m (ví d? 1,2,3,4,5)
UPDATE product
SET original_price = CASE product_id
  WHEN 1 THEN 35999000.00
  WHEN 2 THEN 26999000.00
  WHEN 3 THEN 3490000.00
  WHEN 4 THEN 28999000.00
  WHEN 5 THEN 31999000.00
  ELSE price
END;
