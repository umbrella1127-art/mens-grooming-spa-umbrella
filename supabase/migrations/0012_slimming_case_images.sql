-- メンズ痩身ページの症例写真スロットを追加
-- 2026-08-31
insert into images (slot_key, url, alt, label) values
('slimming_case1', '/images/slimming_case1.jpg', '施術記録（39日間）の3Dボディスキャン比較', '痩身ページ：症例1'),
('slimming_case2', '/images/slimming_case2.jpg', '施術記録（27日間）の3Dボディスキャン比較', '痩身ページ：症例2')
on conflict (slot_key) do nothing;
