-- フェイシャルページのハーブピーリング施術記録写真を追加
-- 2026-09-02
insert into images (slot_key, url, alt, label) values
('facial_herbpeel_before', '/images/facial_herbpeel_before.jpg', 'ハーブピーリング施術前の肌', 'フェイシャルページ：ハーブピーリング施術前（頬）'),
('facial_herbpeel_after', '/images/facial_herbpeel_after.jpg', 'ハーブピーリング施術後の肌', 'フェイシャルページ：ハーブピーリング施術後（頬）'),
('facial_herbpeel_before2', '/images/facial_herbpeel_before2.jpg', 'ハーブピーリング施術前の肌（首元）', 'フェイシャルページ：ハーブピーリング施術前（首元）'),
('facial_herbpeel_after2', '/images/facial_herbpeel_after2.jpg', 'ハーブピーリング施術後の肌（首元）', 'フェイシャルページ：ハーブピーリング施術後（首元）')
on conflict (slot_key) do nothing;
