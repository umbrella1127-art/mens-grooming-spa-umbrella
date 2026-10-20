-- 営業時間を変更: 平日 17:00〜23:00、定休日は不定休
update site_settings set value = '{"text": "平日 17:00〜23:00"}'
where key = 'business_hours_weekday';

update site_settings set value = '{"text": "不定休"}'
where key = 'closed_days';
