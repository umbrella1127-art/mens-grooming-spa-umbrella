-- 初回グルーミング【竹】の価格確定（オーナー確認済み、浄と同額）
-- 2026-08-29
update menus set
  price_yen = 12870,
  price_status = 'fixed',
  price_note = '税込'
where slug = 'first-take';
