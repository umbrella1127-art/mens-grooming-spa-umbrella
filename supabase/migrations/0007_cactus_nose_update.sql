-- サボテンノーズの価格確定（オーナー確認済みPOPより。通常990円。期間限定770円キャンペーンは反映しない）
-- 2026-08-31
update menus set
  duration_min = 5,
  price_yen = 990,
  price_status = 'fixed',
  price_note = '税込・オプション',
  description = '施術時間は5分ほど。効果は3〜4週間キープできます。シェービング・フェイシャルに追加できるオプションです。'
where slug = 'cactus-nose';

insert into images (slot_key, url, alt, label) values
('cactus_hero', '/images/cactus.jpg', 'サボテンノーズ施術の様子', 'サボテンノーズページの写真')
on conflict (slot_key) do nothing;
