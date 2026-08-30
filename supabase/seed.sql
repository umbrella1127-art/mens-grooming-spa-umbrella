-- MEN'S GROOMING SPA umbrella — 初期データ
-- 0001_init.sql 実行後に Supabase SQL Editor で実行してください。
-- 注意: 未確定の価格は price_yen = NULL / price_status = 'tbd' のまま。仮価格は入れない。

-- ========== site_settings ==========
insert into site_settings (key, value, label, group_name, input_type, sort_order) values
-- FV（ファーストビュー）
('fv_copy_main',   '{"text": "疲れが抜けない。\n髪が少し細くなった気がする。\n肌の印象も、変わってきた。"}', 'トップのキャッチコピー（メイン）', 'fv', 'textarea', 1),
('fv_copy_sub',    '{"text": "35歳を過ぎた男性のための、髪・頭皮・肌・身体をまとめて相談できる男性専用サロン。"}', 'トップのキャッチコピー（サブ）', 'fv', 'textarea', 2),
-- CTA
('cta_primary_label', '{"text": "LINEで相談・予約"}', 'CTAボタンの文言', 'cta', 'text', 1),
('cta_sub_label',     '{"text": "予約前のご相談だけでも大丈夫です。"}', 'CTAの補足文言', 'cta', 'text', 2),
-- LINE
('line_url', '{"text": "https://lin.ee/PLACEHOLDER"}', '公式LINEのURL', 'line', 'url', 1),
-- 営業時間
('business_hours_weekday', '{"text": "12:00〜21:00"}', '営業時間（平日）', 'hours', 'text', 1),
('business_hours_weekend', '{"text": "10:00〜19:00"}', '営業時間（土日祝）', 'hours', 'text', 2),
('closed_days',            '{"text": "不定休"}', '定休日', 'hours', 'text', 3),
('hours_note',             '{"text": "時間外をご希望の場合はLINEでご相談ください。"}', '営業時間の補足', 'hours', 'text', 4),
-- 店舗情報
('shop_name',   '{"text": "MEN''S GROOMING SPA umbrella"}', '店舗名', 'shop', 'text', 1),
('address',     '{"text": "群馬県前橋市小相木町388-1"}', '住所', 'shop', 'text', 2),
('parking',     '{"text": "駐車場19台（無料）"}', '駐車場', 'shop', 'text', 3),
('access_note', '{"text": "お車でのご来店が便利です。前橋市内はもちろん、高崎・伊勢崎方面からもお越しいただけます。"}', 'アクセス補足', 'shop', 'textarea', 4),
-- ギフト
('gift_lead_text', '{"text": "大切な人に、「月に一度、自分を整える時間」を贈る。"}', 'ギフトのリード文', 'gift', 'textarea', 1),
('gift_note',      '{"text": "内容・料金はLINEでご案内しています。お気軽にご相談ください。"}', 'ギフトの補足', 'gift', 'textarea', 2);

-- ========== menus ==========
insert into menus (slug, name, category, description, duration_min, price_yen, price_status, price_note, is_published, is_recommended, sort_order, page_slug) values
-- ヘッドスパ
('headspa-tsuki', '月（つき）', 'head_spa',
 'カット＋シェービング＋ヘッドスパ35分。月に一度の身だしなみとリセットを、一度にまとめて。', 90, 9900, 'fixed', '税込', true, false, 1, 'head-spa'),
('headspa-jo', '浄（じょう）', 'head_spa',
 'カット＋シェービング＋ヘッドスパ50分。頭浸浴と専用オイルを使い、たっぷりのマッサージで深く整える上位コース。', 120, 12870, 'fixed', '税込', true, true, 2, 'head-spa'),
-- カットなしメニュー
('headspa-solo-tsuki', 'ヘッドスパ単品（月）', 'head_spa_solo',
 'カット・シェービングなしで、「月」のヘッドスパだけをご利用いただけます。予約枠の目安は60分です。', 60, 8800, 'fixed', '税込・カット不要', true, false, 1, 'head-spa'),
('headspa-solo-jo', 'ヘッドスパ単品（浄）', 'head_spa_solo',
 'カット・シェービングなしで、「浄」のヘッドスパだけをご利用いただけます。', null, 11550, 'fixed', '税込・カット不要', true, false, 2, 'head-spa'),
('headspa-facial-tsuki', 'ヘッドスパ（月）＋フェイシャル', 'head_spa_solo',
 'カット・シェービングなしで、「月」のヘッドスパとフェイシャルを組み合わせたコースです。忙しい日でも、頭と肌をまとめて整えられます。', null, 11000, 'fixed', '〜・税込・カット不要', true, false, 3, 'head-spa'),
('headspa-facial-jo', 'ヘッドスパ（浄）＋フェイシャル', 'head_spa_solo',
 'カット・シェービングなしで、「浄」のヘッドスパとフェイシャルを組み合わせたコースです。忙しい日でも、頭と肌をまとめて整えられます。', null, 13750, 'fixed', '〜・税込・カット不要', true, false, 4, 'head-spa'),
-- 初回グルーミング（名称は仮。お客様向けの名称は後日決定）
('first-ume', '初回グルーミング【梅】', 'first_grooming',
 'カット＋シェービング＋ヘッドスパ「月」35分。月1回の身だしなみを一通り整えるコース。', 120, 9900, 'fixed', '税込', true, false, 1, 'first-grooming'),
('first-take', '初回グルーミング【竹】', 'first_grooming',
 'カット＋シェービング＋ヘッドスパ「浄」50分。溜まった疲れをリセットして、また明日から頑張れる感覚へ。', 150, 12870, 'fixed', '税込', true, true, 2, 'first-grooming'),
('first-matsu', '初回グルーミング【松】', 'first_grooming',
 '竹の内容＋フェイシャル＋肌の水分・油分チェック。疲れをリセットし、肌まで整えて、自分に少し自信を持って帰る。', 180, null, 'tbd', null, true, false, 3, 'first-grooming'),
-- フェイシャル
('facial', 'グルーミングフェイシャル', 'facial',
 '肌の水分・油分を測定してから、オイルのハンドマッサージと美容機器で肌を整えるフェイシャルケア。', 60, null, 'tbd', null, true, false, 1, 'facial'),
-- シェービング
('shaving', 'シェービング', 'shaving',
 '単なるヒゲ剃りではなく、男性の身だしなみを整えるグルーミングとしてのシェービング。各コースに含まれます。', null, null, 'hidden', 'コースに含まれます', true, false, 1, 'shaving'),
('cactus-nose', 'サボテンノーズ（鼻毛ワックス）', 'option',
 '施術時間は5分ほど。効果は3〜4週間キープできます。シェービング・フェイシャルに追加できるオプションです。', 5, 990, 'fixed', '税込・オプション', true, false, 2, 'shaving'),
-- 育毛
('hair-growth-single', '育毛ケア（1回）', 'hair_growth',
 'カウンセリング＋頭皮診断＋育毛施術＋頭皮確認＋アフターカウンセリング。KIRASUIを基本技術とした集中頭皮ケア。', 90, 17600, 'fixed', '税込', true, false, 1, 'hair-growth'),
('hair-growth-3m', '育毛プログラム（お試し3ヶ月）', 'hair_growth',
 '2週間に1回の来店を基本とした、お試し3ヶ月プログラム。', null, null, 'tbd', null, true, false, 2, 'hair-growth'),
('hair-growth-6m', '育毛プログラム（基本6ヶ月）', 'hair_growth',
 '2週間に1回の来店を基本とした、基本の6ヶ月プログラム。', null, null, 'tbd', null, true, true, 3, 'hair-growth'),
-- インナービューティー
('inner-beauty', 'インナービューティー相談', 'inner_beauty',
 '食事・ファスティング・内側からのケアの相談。外側だけではなく、内側からも自分を整える。', null, null, 'hidden', 'ご相談はLINEから', true, false, 1, 'inner-beauty'),
-- 痩身
('slimming', 'メンズ痩身', 'slimming',
 '隣接エステサロンの設備を利用した男性向け痩身ケア。完全予約制。', null, null, 'hidden', '完全予約制・詳細はLINEで', true, false, 1, 'slimming'),
-- 耳つぼ
('mimitsubo', '耳つぼセラピー', 'mimitsubo',
 'ヘッドスパなどと組み合わせられる追加ケア。耳つぼシールを使用し、肩・腰などのポイントを扱います。', 15, 1650, 'fixed', '追加オプション・単品の場合2,200円', true, false, 1, 'head-spa'),
-- ギフト
('gift', 'グルーミングギフト', 'gift',
 'ヘッドスパ35分＋シェービング＋フェイシャル。大切な男性に「整える時間」を贈るギフト体験（カットなし）。', 90, null, 'hidden', '料金はLINEでご案内', true, false, 1, 'gift'),
-- 年間メンバー
('membership', '年間メンバーシップ', 'membership',
 'カット＋シェービング＋ヘッドスパを年間12回。毎月ここで整えると決めた方のための会員制度（準備中）。', null, null, 'hidden', '準備中', true, false, 1, 'membership');

-- ========== faqs ==========
insert into faqs (question, answer, category, sort_order, is_published) values
('美容やヘッドスパの知識がまったくないのですが、大丈夫ですか？',
 'はい、まったく問題ありません。当店のお客様のほとんどは「美容に詳しい方」ではなく、「最近疲れが取れない」「髪や頭皮が気になってきた」という35〜50代の男性です。カウンセリングで丁寧にお伺いしますので、何を相談すればいいか分からない状態のままお越しください。', '初めての方', 1, true),
('どのメニューを選べばいいか分かりません。',
 '迷ったら、LINEで「どれを選べばいいか分からない」とそのままお送りください。ご希望やお悩みを伺ってご提案します。初めての方には、カット・シェービング・50分ヘッドスパがセットになった初回グルーミングコースをおすすめすることが多いです。', '初めての方', 2, true),
('施術中は会話をしないといけませんか？',
 'いいえ。当店は施術中の会話を基本的にお求めしません。照明を落とした静かな空間で、スマホからも少し離れて「何もしなくていい時間」をお過ごしください。もちろん、お話ししたい方はお気軽にどうぞ。', '過ごし方', 3, true),
('本当に男性専用ですか？',
 'はい、男性専用サロンです。女性のお客様が多い美容室が苦手な方、人目を気にせず美容の相談をしたい方に落ち着いてお過ごしいただける空間です。', '過ごし方', 4, true),
('駐車場はありますか？',
 '19台分の無料駐車場がございます。お車でのご来店が便利です。', 'アクセス', 5, true),
('初回はどのくらい時間がかかりますか？',
 '初回グルーミングコースは約120分です。カウンセリング、頭皮診断、カット、シェービング、ヘッドスパ、肩マッサージ、頭皮確認、アフターカウンセリングまで含みます。', '初めての方', 6, true),
('予約はどうすればいいですか？',
 '公式LINEからご希望のメニューと日時候補をお送りください。空き状況を確認のうえ、こちらからご連絡します。当店は完全予約制です。', '予約', 7, true),
('支払い方法は何が使えますか？',
 '現金のほか、各種キャッシュレス決済に対応しています。詳しくはLINEでお問い合わせください。', '予約', 8, true);

-- ========== images（スロット） ==========
-- url は開発初期はローカル public/images/ を参照。本番では管理画面からStorageへ差し替え可能。
insert into images (slot_key, url, alt, label) values
('logo',              '/images/logo.png',        'MEN''S GROOMING SPA umbrella', 'ロゴ'),
('hero_top',          '/images/hero_top.jpg',    '落ち着いた男性専用サロンの空間', 'トップのメイン写真'),
('salon_interior',    '/images/salon.jpg',       '店内の様子', '店内写真'),
('owner_portrait',    '/images/owner.jpg',       'オーナー 井上孝志', '井上さんの写真'),
('head_spa_hero',     '/images/head_spa.jpg',    'ヘッドスパ施術の様子', 'ヘッドスパページの写真'),
('facial_hero',       '/images/facial.jpg',      'フェイシャルケアの様子', 'フェイシャルページの写真'),
('shaving_hero',      '/images/shaving.jpg',     'シェービングの様子', 'シェービングページの写真'),
('first_visit_hero',  '/images/first_visit.jpg', '初回カウンセリングの様子', '初めての方へページの写真'),
('hair_growth_hero',  '/images/hair_growth.jpg', '頭皮診断の様子', '育毛ページの写真'),
('inner_beauty_hero', '/images/inner_beauty.jpg','インナービューティーのイメージ', 'インナービューティーページの写真'),
('slimming_hero',     '/images/slimming.jpg',    '痩身ケアのイメージ', '痩身ページの写真'),
('gift_hero',         '/images/gift.jpg',        'ギフトのイメージ', 'ギフトページの写真'),
('voice_1',           '/images/voice_1.jpg',     'お客様の声', 'お客様の声1'),
('voice_2',           '/images/voice_2.jpg',     'お客様の声', 'お客様の声2'),
('access_entrance',   '/images/access_entrance.jpg', '店舗エントランス', 'ACCESSページの写真'),
('owner_cutting',     '/images/owner_cutting.jpg', 'カット施術中の井上', '井上さんの施術風景'),
('cactus_hero',       '/images/cactus.jpg', 'サボテンノーズ施術の様子', 'サボテンノーズページの写真');

-- ========== ab_variants（FVコピーのA/B案を保存） ==========
insert into ab_variants (slot_key, variant_label, content, is_active) values
('fv_copy_main', 'A', '{"text": "疲れが抜けない。\n髪が少し細くなった気がする。\n肌の印象も、変わってきた。"}', true),
('fv_copy_main', 'B', '{"text": "月に一度、自分を整える。"}', false);

-- ========== posts（サンプル下書き） ==========
insert into posts (slug, title, excerpt, body_markdown, status, source) values
('welcome',
 'MEN''S GROOMING SPA umbrella のブログを始めます',
 '男性の髪・頭皮・肌・身体のことを、専門的になりすぎず分かりやすくお伝えしていきます。',
 E'これはサンプル記事（下書き）です。管理画面から編集・公開できます。\n\n## このブログでお伝えしていくこと\n\n- 35歳からの髪と頭皮のこと\n- ヘッドスパで何が変わるのか\n- 男性の肌ケアの始め方\n- 内側から整えるという考え方\n\n「最近ちょっと変わってきたかも」と感じている方に向けて、押し売りのない情報をお届けします。',
 'draft', 'manual');
