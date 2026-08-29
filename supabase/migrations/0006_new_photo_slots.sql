-- 実写差し替えに伴う新規画像スロット追加
-- 2026-08-29: head_spa_hero/facial_hero/shaving_hero/salon_interior/first_visit_hero は
-- 同じファイル名を上書きしたためURL変更不要。新規スロットのみ追加する。
insert into images (slot_key, url, alt, label) values
('access_entrance', '/images/access_entrance.jpg', '店舗エントランス', 'ACCESSページの写真'),
('owner_cutting', '/images/owner_cutting.jpg', 'カット施術中の井上', '井上さんの施術風景')
on conflict (slot_key) do nothing;
