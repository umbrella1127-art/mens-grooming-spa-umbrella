-- トップのファーストビュー写真をヘッドスパ施術シーンに差し替え
-- 2026-08-31
update images set url = '/images/hero_top_v2.jpg', alt = 'ヘッドスパ施術を受ける男性のお客様'
where slot_key = 'hero_top';
