-- カットなしメニューの追加（オーナー確認済み）
-- 2026-08-29: ヘッドスパ単品／ヘッドスパ+フェイシャルを追加。価格・所要時間は未定のため tbd。

insert into menus (slug, name, category, description, duration_min, price_yen, price_status, price_note, is_published, is_recommended, sort_order, page_slug) values
('headspa-solo', 'ヘッドスパ単品', 'head_spa_solo',
 'カット・シェービングなしで、ヘッドスパだけをご利用いただけます。予約枠の目安は60分です。', 60, null, 'tbd', 'カット不要', true, false, 1, 'head-spa'),
('headspa-facial-solo', 'ヘッドスパ＋フェイシャル', 'head_spa_solo',
 'カット・シェービングなしで、ヘッドスパとフェイシャルを組み合わせたコースです。忙しい日でも、頭と肌をまとめて整えられます。', null, null, 'tbd', 'カット不要', true, false, 2, 'head-spa')
on conflict (slug) do nothing;
