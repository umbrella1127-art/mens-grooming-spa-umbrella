-- インナービューティーページに商品写真スロットを追加
-- 2026-08-31
insert into images (slot_key, url, alt, label) values
('inner_beauty_product', '/images/inner_beauty_product.jpg', 'エステプロラボ社の商品', 'インナービューティーページの商品写真')
on conflict (slot_key) do nothing;
