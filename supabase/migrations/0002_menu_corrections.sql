-- メニュー情報の修正（オーナー確認済み）
-- 2026-08-29: 浄の所要時間、初回コースの所要時間、耳つぼの価格・説明を修正

update menus set duration_min = 120 where slug = 'headspa-jo';
update menus set duration_min = 150 where slug = 'first-take';
update menus set duration_min = 180 where slug = 'first-matsu';

update menus set
  price_yen = 1650,
  price_status = 'fixed',
  price_note = '追加オプション・単品の場合2,200円',
  description = 'ヘッドスパなどと組み合わせられる追加ケア。耳つぼシールを使用し、肩・腰などのポイントを扱います。'
where slug = 'mimitsubo';
