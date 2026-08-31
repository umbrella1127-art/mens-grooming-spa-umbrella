-- 初回グルーミング3コース（松・竹・梅）を GROOMING / DEEP REST / TOTAL CARE に改名・価格改定
-- 2026-08-31
update menus set
  name = 'GROOMING｜身だしなみを整える',
  description = 'カット＋シェービング＋ヘッドスパ「月」35分。髪・顔・頭を一度に整える、umbrellaの基本コース。まずは月に一度のメンテナンスを始めたい方におすすめです。',
  is_recommended = false
where slug = 'first-ume';

update menus set
  name = 'DEEP REST｜深く休む',
  description = 'カット＋シェービング＋ヘッドスパ「浄」50分。頭浸浴と専用オイルを使い、頭から肩までじっくりとほぐします。脳疲労や、休んでも抜けにくい疲れを感じている方へ。',
  is_recommended = false
where slug = 'first-take';

update menus set
  name = 'TOTAL CARE｜印象まで整える',
  description = 'GROOMINGの内容＋2種類のフェイシャルケア＋肌の水分・油分チェック。髪と頭を整えるだけでなく、疲れや年齢が表れやすい肌までケア。清潔感のある印象と、自信を取り戻したい方のためのコースです。',
  price_yen = 13860,
  price_status = 'fixed',
  price_note = '〜・税込',
  is_recommended = true
where slug = 'first-matsu';
