-- ヘッドスパ単品・カットなしメニューの価格改定
-- 2026-08-31
update menus set price_yen = 7700 where slug = 'headspa-solo-tsuki';
update menus set price_yen = 10450 where slug = 'headspa-solo-jo';

-- 「月」＋フェイシャルの組み合わせをシェービング込みの新セットに変更
update menus set
  slug = 'headspa-shave-facial-tsuki',
  name = 'シェービング＋ヘッドスパ「月」＋ベーシックGRフェイシャル',
  description = 'カットなしでご利用いただけるセットコースです。シェービングで肌を整え、ヘッドスパ「月」で頭をほぐし、ベーシックGRフェイシャルで肌までケア。通常価格12,100円のところ、10,450円でご利用いただけます。',
  price_yen = 10450
where slug = 'headspa-facial-tsuki';

-- 「浄」＋フェイシャルの組み合わせは非公開に（他の組み合わせもございます、の案内でカバー）
update menus set is_published = false where slug = 'headspa-facial-jo';
