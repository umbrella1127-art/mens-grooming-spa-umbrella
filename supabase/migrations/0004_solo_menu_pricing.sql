-- カットなしメニューを「月」「浄」の2階層に分割・価格確定（オーナー確認済み）
-- 2026-08-29

-- 既存の汎用行を「月」版として更新
update menus set
  slug = 'headspa-solo-tsuki',
  name = 'ヘッドスパ単品（月）',
  description = 'カット・シェービングなしで、「月」のヘッドスパだけをご利用いただけます。予約枠の目安は60分です。',
  price_yen = 8800,
  price_status = 'fixed',
  price_note = '税込・カット不要',
  duration_min = 60,
  sort_order = 1
where slug = 'headspa-solo';

update menus set
  slug = 'headspa-facial-tsuki',
  name = 'ヘッドスパ（月）＋フェイシャル',
  description = 'カット・シェービングなしで、「月」のヘッドスパとフェイシャルを組み合わせたコースです。忙しい日でも、頭と肌をまとめて整えられます。',
  price_yen = 11000,
  price_status = 'fixed',
  price_note = '〜・税込・カット不要',
  sort_order = 3
where slug = 'headspa-facial-solo';

-- 「浄」版を新規追加
insert into menus (slug, name, category, description, duration_min, price_yen, price_status, price_note, is_published, is_recommended, sort_order, page_slug) values
('headspa-solo-jo', 'ヘッドスパ単品（浄）', 'head_spa_solo',
 'カット・シェービングなしで、「浄」のヘッドスパだけをご利用いただけます。', null, 11550, 'fixed', '税込・カット不要', true, false, 2, 'head-spa'),
('headspa-facial-jo', 'ヘッドスパ（浄）＋フェイシャル', 'head_spa_solo',
 'カット・シェービングなしで、「浄」のヘッドスパとフェイシャルを組み合わせたコースです。忙しい日でも、頭と肌をまとめて整えられます。', null, 13750, 'fixed', '〜・税込・カット不要', true, false, 4, 'head-spa')
on conflict (slug) do nothing;
