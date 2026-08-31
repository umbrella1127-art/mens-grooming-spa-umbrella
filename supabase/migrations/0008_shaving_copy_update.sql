-- シェービングページの全面改訂に伴うメニュー表記の更新
-- 2026-08-31
update menus set
  name = 'プロフェッショナル・シェービング',
  description = '温かな蒸しタオルときめ細かな泡で肌を整え、顔から首元まで丁寧に仕上げます。単にヒゲを剃るのではなく、顔全体の清潔感を引き出すためのシェービングです。',
  price_note = 'カットコースに含まれます'
where slug = 'shaving';

-- サボテンノーズ：価格は非表示（990円のままDBには残すが表示しない）、所要時間は10分に修正
update menus set
  duration_min = 10,
  price_status = 'hidden',
  price_note = 'オプション',
  description = '自分では確認しにくい鼻まわりまで整える、男性の身だしなみのためのオプションです。'
where slug = 'cactus-nose';
