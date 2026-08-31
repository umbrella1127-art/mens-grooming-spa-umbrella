-- 育毛ページのビフォーアフター記録用の画像スロット追加
-- 2026-08-31
insert into images (slot_key, url, alt, label) values
('hair_growth_before', '/images/hair_growth_before.jpg', '施術前の頭皮記録', '育毛ページ：ビフォー'),
('hair_growth_after1', '/images/hair_growth_after1.jpg', '施術当日の頭皮記録', '育毛ページ：当日'),
('hair_growth_after2', '/images/hair_growth_after2.jpg', '2回目施術後の頭皮記録', '育毛ページ：2回目'),
('hair_growth_after3', '/images/hair_growth_after3.jpg', '3回目施術後の頭皮記録', '育毛ページ：3回目')
on conflict (slot_key) do nothing;
