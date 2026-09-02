-- ハーブピーリング写真のラベルを「首元」→「顎」に修正
-- 2026-09-02
update images set alt = 'ハーブピーリング施術前の肌（顎）', label = 'フェイシャルページ：ハーブピーリング施術前（顎）'
where slot_key = 'facial_herbpeel_before2';

update images set alt = 'ハーブピーリング施術後の肌（顎）', label = 'フェイシャルページ：ハーブピーリング施術後（顎）'
where slot_key = 'facial_herbpeel_after2';
