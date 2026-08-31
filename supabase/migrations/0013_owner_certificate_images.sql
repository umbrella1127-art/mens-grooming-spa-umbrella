-- ABOUTページの認定証画像スロットを追加
-- 2026-08-31
insert into images (slot_key, url, alt, label) values
('cert_headspa', '/images/cert_headspa.jpg', 'HIGUCHI式ショートヘッドスパ 修了認定証', 'ABOUTページ：資格証（ヘッドスパ）'),
('cert_fasting', '/images/cert_fasting.jpg', '公認エキスパート ファスティングカウンセラー 認定証', 'ABOUTページ：資格証（ファスティング）'),
('cert_mimitsubo', '/images/cert_mimitsubo.jpg', '耳つぼセラピープロ養成講座 修了証', 'ABOUTページ：資格証（耳つぼ）')
on conflict (slot_key) do nothing;
