-- トップページの期間限定キャンペーンバナー（新規限定・2026年9-10月）用の画像スロットを追加
-- 実際の施術写真は /admin/images から差し替える。それまでは facial_hero と同じ写真を暫定表示。
-- 2026-09-18
insert into images (slot_key, url, alt, label) values
('campaign_facial', '/images/facial.jpg', 'フェイシャル施術の様子', 'トップページ：期間限定キャンペーンバナーの写真')
on conflict (slot_key) do nothing;
