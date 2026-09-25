-- トップページFVに「何の店か」を一瞬で伝えるアイキャッチ行を追加
-- （A/Bテスト方針: まずは案Aの文言で運用し、期間後に /admin/settings で文言を差し替えて計測する）
insert into site_settings (key, value, label, group_name, input_type, sort_order)
values (
  'fv_eyebrow',
  '{"text": "前橋の男性専用グルーミングサロン｜理容室 × ヘッドスパ"}',
  'アイキャッチ（何の店か一言で）',
  'fv',
  'text',
  0
)
on conflict (key) do nothing;

-- サブコピーを「何のサービスがあるか」が伝わる文言へ更新（FV改善案A）
update site_settings set value = '{"text": "カット・シェービングの理容室に、極上ヘッドスパとフェイシャルを。\n仕事の疲れも、見た目の変化も、ひとつの場所で。"}'
where key = 'fv_copy_sub';
