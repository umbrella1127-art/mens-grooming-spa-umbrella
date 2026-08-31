-- 育毛コースを「回数制」の価格体系に更新（オーナー提供の価格表より）
-- 2026-08-31
update menus set
  name = '抜け毛予防コース（1回）',
  description = 'カウンセリング＋頭皮診断＋育毛施術＋頭皮確認＋アフターカウンセリング。まずは1回、今の頭皮の状態を知りたい方へ。'
where slug = 'hair-growth-single';

update menus set
  name = '育毛スタートコース（5回）',
  description = '通常価格88,000円のところ、17,600円お得。育毛剤プレゼント（10,000円相当）付き。',
  price_yen = 70400,
  price_status = 'fixed',
  price_note = '税込・特典あり'
where slug = 'hair-growth-3m';

update menus set
  name = '育毛チャレンジコース（10回）',
  description = '通常価格176,000円のところ、44,000円お得。育毛剤プレゼント（10,000円相当）＋育毛系シャンプー1本プレゼント付き。',
  price_yen = 132000,
  price_status = 'fixed',
  price_note = '税込・特典あり'
where slug = 'hair-growth-6m';
