-- フェイシャルページのハーブピーリング施術記録写真を追加（口元・フェイスライン・顎アップ）
-- 2026-09-07
insert into images (slot_key, url, alt, label) values
('facial_herbpeel_before3', '/images/facial_herbpeel_before3.jpg', 'ハーブピーリング施術前の肌（口元）', 'フェイシャルページ：ハーブピーリング施術前（口元）'),
('facial_herbpeel_after3', '/images/facial_herbpeel_after3.jpg', 'ハーブピーリング施術後の肌（口元）', 'フェイシャルページ：ハーブピーリング施術後（口元）'),
('facial_herbpeel_before4', '/images/facial_herbpeel_before4.jpg', 'ハーブピーリング施術前の肌（フェイスライン）', 'フェイシャルページ：ハーブピーリング施術前（フェイスライン）'),
('facial_herbpeel_after4', '/images/facial_herbpeel_after4.jpg', 'ハーブピーリング施術後の肌（フェイスライン）', 'フェイシャルページ：ハーブピーリング施術後（フェイスライン）'),
('facial_herbpeel_before5', '/images/facial_herbpeel_before5.jpg', 'ハーブピーリング施術前の肌（顎アップ）', 'フェイシャルページ：ハーブピーリング施術前（顎アップ）'),
('facial_herbpeel_after5', '/images/facial_herbpeel_after5.jpg', 'ハーブピーリング施術後の肌（顎アップ）', 'フェイシャルページ：ハーブピーリング施術後（顎アップ）')
on conflict (slot_key) do nothing;
