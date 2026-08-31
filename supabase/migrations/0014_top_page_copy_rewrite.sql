-- トップページのファーストビューコピーをリライト
-- 2026-08-31
update site_settings set value = '{"text": "頑張る男の為の休息地。"}'
where key = 'fv_copy_main';

update site_settings set value = '{"text": "極上ヘッドスパ × 肌ケアで、\n仕事の疲れも、見た目の年齢サインも、\nまとめてゼロリセット。"}'
where key = 'fv_copy_sub';
