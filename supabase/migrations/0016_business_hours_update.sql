-- 営業時間・定休日を確定内容に更新
-- 2026-08-31
update site_settings set value = '{"text": "火・金曜 17:00〜23:00"}'
where key = 'business_hours_weekday';

update site_settings set value = '{"text": "土・日・祝 10:00〜19:00"}'
where key = 'business_hours_weekend';

update site_settings set value = '{"text": "月・水・木曜"}'
where key = 'closed_days';
