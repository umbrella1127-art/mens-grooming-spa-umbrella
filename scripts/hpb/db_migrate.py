# -*- coding: utf-8 -*-
"""初期データの投入（何度実行しても安全）。

    python scripts/hpb/db_migrate.py

- テーブルの存在確認（スキーマ自体は supabase/migrations/0027_kpi_analysis.sql）
- scripts/hpb/config.json の店舗設定を stores へ登録
- data/hpb/<store>/history.json（parse_salon_report.py の出力）を hpb_monthly_kpi へ取り込む
- チーム名簿と標準の分析手法レジストリを投入
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from hpb_db import (DATA_DIR, KPI_TABLES, connect, load_config, upsert,  # noqa: E402
                    register_method)

# チーム名簿：13体のサブエージェントの人格。.claude/agents/*.md の name と agent 列が対応する。
ROSTER = [
    # agent, 表示名, ふりがな, 年齢, 役割名, チーム, アイコン, 一言, チーム色, 並び順
    ("hpb-orchestrator", "陣内 蒼", "じんない あおい", 42, "統括ディレクター", "統括", "🧭",
     "今月の進行は私が仕切ります。誰が何を見るかは私が決めます。", "#b0333f", 0),
    ("hpb-collector", "見留 光", "みとめ ひかる", 24, "集計担当", "集計", "📥",
     "数字はぜんぶ拾いました。抜けがあったら教えてください。", "#2a6fb0", 1),
    ("hpb-analyst-funnel", "早瀬 蓮", "はやせ れん", 29, "新規獲得ファネル担当", "分析", "🎯",
     "どこで新規のお客さんを取りこぼしているか、必ず一点に絞って持ってきます。", "#2f8f5c", 2),
    ("hpb-analyst-retention", "常盤 結衣", "ときわ ゆい", 31, "定着・受け皿担当", "分析", "🌱",
     "獲得した新規が根付いているか、離れていないかを見ています。", "#2a8f8f", 3),
    ("hpb-analyst-market", "神谷 悠真", "かみや ゆうま", 34, "市場・プラン担当", "分析", "🗺️",
     "競合とプランの数字は、必ずエリア平均の入れ替わりを疑ってから見ます。", "#3f5a8f", 4),
    ("hpb-content-analyst", "桐野 茜", "きりの あかね", 27, "コンテンツ分析担当", "分析", "📝",
     "どのブログ・特集・クーポンが効いたか、言葉にして持ってきます。", "#7a3f8f", 5),
    ("hpb-page-scout", "白鳥 陽菜", "しらとり ひな", 25, "実ページ調査担当", "調査", "🔎",
     "レポートの数字より先に、実際の画面を自分の目で見に行きます。", "#2a8f8f", 6),
    ("hpb-strategist-price", "高梨 誠", "たかなし まこと", 36, "価格・採算担当", "戦略立案", "💰",
     "値下げは客数の試算と限界利益がセットです。感覚では出しません。", "#b07a2a", 7),
    ("hpb-strategist-creative", "藤代 澪", "ふじしろ みお", 28, "訴求・コピー担当", "戦略立案", "✍️",
     "選ばれている言葉から逆算して書きます。思いつきでは書きません。", "#b07a2a", 8),
    ("hpb-strategist-ops", "米山 徹", "よねやま とおる", 33, "運用・口コミ担当", "戦略立案", "🧾",
     "現場が3日で続けられる手順かどうかを、いちばん気にしています。", "#b07a2a", 9),
    ("hpb-strategist-page", "九十九 陽", "つくも よう", 26, "実ページ起点戦略担当", "戦略立案", "🖥️",
     "画面に実際どう書いてあるかを根拠にします。レポートの外側を見ます。", "#b07a2a", 10),
    ("hpb-strategist", "九条 玲", "くじょう れい", 40, "戦略統合担当", "戦略決定", "⚖️",
     "案は作りません。出てきた案を採点して、選ぶのが仕事です。", "#6b4fa0", 11),
    ("hpb-reporter", "結城 かなで", "ゆうき かなで", 30, "レポート担当", "レポート", "📊",
     "DBにある数字だけで書きます。雰囲気で盛ったことは一度もありません。", "#a15a3a", 12),
]


SEED_METHODS = [
    ("funnel_bottleneck", "集客ファネル分解", "funnel",
     "総PV→サロン情報PV→CVR→クーポンメニューPV→ACR→予約完了→予約数→売上の各段階をエリア平均と比較し、最も差が開く段階をボトルネックとして特定する。",
     "hpb_monthly_kpi から各段階の自店値とエリア平均値を取り出し、(自店/平均) の比率を段階ごとに算出。比率が最小の段階がボトルネック。ACRとCVRは差分(pt)でも評価する。",
     "hpb-analyst-funnel"),
    ("trend_mom_yoy", "前月比・前年同月比トレンド", "funnel",
     "主要KPIの前月比・前年同月比・13ヶ月推移を算出し、季節性と異常値を区別する。",
     "hpb_monthly_kpi を月順に並べ、各KPIの前月比・前年同月比を計算。前年同月比が取れる月は季節性を考慮した評価を行う。単月の増減を騒ぐ前に必ず前年同月と比較すること。",
     "hpb-analyst-funnel"),
    ("monthly_evaluation", "今月の総合評価（採点）", "funnel",
     "その月号を「何点の月だったか」で評価する。単なる増減報告ではなく、新規獲得を主軸に、エリア平均比・自店の過去実績比の3軸で総合判定する。",
     "(1) ★新規軸（最重視）: 新規数・新規獲得単価CPA・新規率が直近12ヶ月の中でどの位置か。"
     " (2) エリア平均比: CVR・ACR・PVがエリア平均を上回るか。"
     " (3) 前年同月比: 季節性を除いた実力の変化。"
     " 各軸を5段階で評価し総合点を出す。良かった点と悪かった点を必ず両方挙げ、"
     "『新規が取れた月かどうか』を評価の結論に据える。",
     "hpb-analyst-market"),
    ("new_customer_cpa", "新規獲得単価（CPA）と新規ROI ★最重要", "funnel",
     "ホットペッパーは新規集客のための投資という前提に立ち、掲載料が新規客を何人・いくらで連れてきたかを評価する。全体売上でのROIは既存客の来店に左右されてブレるため、判断の主軸は必ず新規側に置く。",
     "(1) 新規獲得単価CPA = plan_cost_yen ÷ customers_new。これを毎月必ず算出し推移を見る。"
     " (2) 新規ROI = sales_new_man_yen×10000 ÷ plan_cost_yen（新規売上が未取得なら customers_new × unit_price_new_yen で代替、それも無ければ全体客単価で概算し『概算』と明記）。"
     " (3) 初回回収率 = 新規客単価 ÷ CPA。1.0を超えていれば初回来店だけで掲載料を回収できている。"
     " (4) 新規リピート率(new_repeat_rate)を掛け合わせ、2回目以降まで含めた実質的な採算も併記する。"
     " (5) プラン別・月別に比較し、CPAが悪化した月は原因（新規数の減少か掲載料の変化か）まで特定する。"
     " 全体売上ベースのROIも参考値として併記してよいが、主役はCPAであることを崩さない。",
     "hpb-analyst-funnel"),
    ("new_acquisition_funnel", "新規集客ファネル ★最重要", "funnel",
     "ファネルを『新規客をどれだけ取れたか』の観点で評価する。予約全体ではなく新規予約に注目し、どの段階で新規客を失っているかを特定する。",
     "総PV→サロン情報PV→CVR→クーポンメニューPV→ACR→予約完了 の各段階に加え、"
     "予約のうち新規が占める割合(customers_new÷net_reservations)と、新規向けクーポン(hpb_coupon_stats.label='新規')の予約実績を見る。"
     "新規率がエリア平均や比較サロン平均(hpb_ribbon_metrics.new_ratio)とどう違うかを必ず比較し、"
     "『新規が入り口で落ちている』のか『そもそも新規向けの受け皿が弱い』のかを切り分ける。",
     "hpb-analyst-funnel"),
    ("plan_roi", "掲載プラン費用対効果（全体）", "funnel",
     "掲載プランごとの全体売上ROIを参考指標として算出する。主軸は new_customer_cpa なので、こちらは補助として扱う。",
     "hpb_monthly_kpi の plan / plan_cost_yen / sales_man_yen を使い ROI=売上÷掲載料 をプラン別に平均する。"
     "必ず new_customer_cpa の結果とセットで提示し、全体ROIだけでプラン判断をしないこと。",
     "hpb-analyst-market"),
    ("blog_effectiveness", "ブログ別の反響分析", "content",
     "どのブログが読まれ、どのブログが実際にクーポンクリック（＝集客）につながったかを特定する。テーマ・タイトルの型を抽出して次に書くべきブログを提案する。",
     "hpb_blog_effects からブログ別クリック数を集計。hpb_monthly_kpi の blog_posts / blog_views と併せ、投稿数あたり閲覧数・閲覧あたりクリック率を算出。クリックが付いたブログのタイトルに共通するテーマ（悩み訴求/季節/施術解説など）を分類し、勝ちパターンを言語化する。",
     "hpb-content-analyst"),
    ("blog_lift", "ブログ投稿量と集客の相関", "content",
     "ブログ投稿を増やした月に閲覧・予約が伸びたかを月次で検証し、投稿の費用対効果を示す。",
     "hpb_monthly_kpi の blog_posts の月次増分（当月投稿数）と blog_views・net_reservations を並べ、増分の大きい月と小さい月で閲覧数・予約数を比較。相関を断定せず「傾向」として提示し、サンプルが少ない場合はその旨を明記する。",
     "hpb-content-analyst"),
    ("feature_opportunity", "特集の参画機会分析", "content",
     "エリアで閲覧率が高い特集に自店が参画できているか、参画済み特集でクリックを取れているかを分析し、未開拓の特集を機会として提示する。",
     "hpb_feature_stats を閲覧率(view_rate)降順で並べ、joined=false または own_clicks=0 の高閲覧率特集を「機会」として抽出。参画済みでクリックが平均(avg_clicks)を下回る特集は「テコ入れ対象」。特集はクーポン・スタイルの紐付けで露出が決まるため、紐付け状況も併せて確認する。",
     "hpb-content-analyst"),
    ("feature_coupon_link", "特集経由クーポンの実績", "content",
     "特集からどのクーポンがクリックされたかを分析し、特集ごとに最適なクーポンを提案する。",
     "hpb_feature_coupon_clicks を特集×クーポンで集計。クリックの多い組み合わせを勝ちパターンとし、高閲覧率なのにクリックのない特集には別クーポンの紐付けを提案する。",
     "hpb-content-analyst"),
    ("coupon_portfolio", "クーポン構成の最適化", "content",
     "新規/全員/再来のラベル構成、価格帯分布、実際の予約実績から、削るべきクーポンと足すべきクーポンを特定する。",
     "hpb_coupon_stats をラベル別・価格帯別に集計し reservations と突き合わせる。予約ゼロが継続して続くクーポンは削減候補。予約が集中する価格帯を特定し、その帯の選択肢が薄ければ追加を提案。hpb_ribbon_metrics のラベル別本数（比較サロン平均）とも比較する。",
     "hpb-content-analyst"),
    ("style_contribution", "スタイルの集客貢献", "content",
     "どのスタイル写真が閲覧・ブックマークされ、予約につながっているかを分析し、次に撮るべきスタイルを提案する。",
     "hpb_style_stats の views / bookmarks を降順に並べ、上位スタイルの傾向（長さ・メニュー・スタイリスト）を分類。hpb_monthly_kpi の style_count と pv_style_detail の推移から投稿量の効果も評価する。",
     "hpb-content-analyst"),
    ("stylist_contribution", "スタイリスト別の貢献と指名", "customer",
     "スタイリスト別の予約数・閲覧数・ブックマーク・指名予約可否を突き合わせ、人気があるのに受け皿がないスタイリストを発見する。",
     "hpb_stylist_stats で views/bookmarks が高いのに reservations が少ない、または shimei_available=false のスタイリストを機会損失として抽出する。",
     "hpb-analyst-retention"),
    ("customer_retention", "新規獲得とリピート定着", "customer",
     "新規/リピーター構成、新規リピート率、指名率の推移から定着状況を評価し、離脱ポイントを特定する。",
     "hpb_monthly_kpi の customers_new / customers_repeat / new_repeat_rate / shimei_with を時系列で見る。新規リピート率は半年前の新規客が再来した率なので、6ヶ月前の新規数と併せて解釈する。再来向けクーポンの有無（hpb_coupon_stats）とも関連づける。",
     "hpb-analyst-retention"),
    ("competitor_gap", "競合との差分分析", "competitor",
     "比較検討されているサロンとの口コミ数・スタイル数・価格帯の差を定量化し、勝てる土俵と埋めるべき差を示す。",
     "hpb_competitor_stats と hpb_ribbon_metrics を使い、自店と比較サロン平均の差が大きい項目を列挙。価格が高い場合は「高さを正当化する材料（口コミ・実績・専門性）」が揃っているかを確認する観点で評価する。",
     "hpb-analyst-market"),
    ("capacity_utilization", "稼働率と受け入れ余力", "competitor",
     "残キャパ・土日埋まり率から、集客を増やした場合に捌けるかを判定する。",
     "hpb_ribbon_metrics の残キャパ率・埋まり率を比較サロン平均と比較。余力が大きい場合は集客施策を積極化してよい根拠になる。逆に埋まっている場合は単価改善を優先する。",
     "hpb-analyst-retention"),
    ("plan_cpa_comparison", "掲載プラン別のCPAと限界利益の比較", "strategy",
     "掲載プランごとに『新規1人をいくらで獲得したか』と『最終的に手元にいくら残ったか』を比較し、プラン選択の是非を数字で判定する。新規数が多いプランが必ずしも得ではない。",
     "plan別に AVG(customers_new) / plan_cost_yen / AVG(sales_man_yen) を集計し、"
     "CPA = 掲載料÷平均新規、限界利益 = 平均売上×(1−変動費率) − 掲載料÷10000 を算出。"
     "変動費率は stores.variable_cost_rate。"
     "『新規数は多いがCPAが悪い』プランを見抜くことが目的。"
     "さらに損益分岐として『現行プランと同じ限界利益を出すには他プランで何人必要か』を必ず出す。"
     "掲載料が暫定値の場合は結論がどこまで頑健か（何円までなら結論が変わらないか）も併記する。",
     "hpb-strategist-price"),
    ("price_elasticity_sim", "値下げ・値上げの採算シミュレーション", "strategy",
     "クーポン価格を動かした場合に、新規が何人増えれば損益が合うかを試算する。『安くすれば増える』を利益ベースで検証し、増えても損なら却下する。",
     "(1) 現状の 新規数・新規客単価・限界利益 を基準に置く。"
     " (2) 価格変更後の客数を複数の弾力性（+20% / +50% / +100%）で振り、それぞれ売上・CPA・限界利益を計算。"
     " (3) 損益分岐点（値下げ前と同じ限界利益になる客数）を必ず算出し、それが現実的かを"
     "自店の過去最高新規数・エリアの需要規模と照らして判定する。"
     " (4) 既存客・リピート客の単価への波及も試算する（新規限定にできるかを確認）。"
     " (5) 残キャパ（hpb_ribbon_metrics.capacity_free_rate）を確認し、席が埋まる水準なら増客より単価へ結論を切り替える。"
     " 前提は必ず assumptions に明記し、1つの弾力性だけで結論を出さない。",
     "hpb-strategist-price"),
    ("coupon_naming", "クーポン表示名と見せ方の改善", "strategy",
     "同じ価格・同じ内容のまま、名前と見せ方だけで予約率を上げる。特に『クリックは多いのに予約ゼロ』のクーポンを対象に、期待と中身のズレを埋める。",
     "hpb_coupon_stats（予約実績）と hpb_feature_coupon_clicks / hpb_blog_effects（クリック）を"
     "クーポン名で突き合わせ、クリック多×予約0 のものを抽出する。"
     "予約が入っているクーポン名に共通する語彙（施術内容が明快・悩みが主語など）を抽出し、"
     "それを勝ちパターンとして反映した書き換え案を『そのままコピペできる完成形』で出す。"
     "守り（市場平均的な書き方）/標準/攻め（市場にない切り口）の3案を必ず用意し、"
     "攻めの案には撤退条件を付ける。誇大表現や効果の断定はしない。",
     "hpb-strategist-creative"),
    ("market_positioning", "市場での立ち位置の選択", "strategy",
     "エリアの競合と比べて『平均に寄せる』のか『振り切る』のかを選ぶ。価格が市場最高値なら、それを正当化する材料が揃っているかを検証する。",
     "hpb_competitor_stats で自店のカット料金・口コミ数・スタイル数の順位を出し、"
     "hpb_ribbon_metrics の avg_booking_new（新規平均予約額）を比較サロン平均と対比する。"
     "『高価格×少ない口コミ』のように、価格の高さを支える材料が不足している組み合わせを特定する。"
     "そのうえで (a)市場平均に寄せる (b)現状維持で材料を積む (c)さらに専門特化で振り切る "
     "の3つの立ち位置それぞれについて、必要な打ち手と想定される結果を示す。",
     "hpb-strategist-creative"),
    ("strategy_outcome_review", "前回提案の効果検証", "strategy",
     "前月号までに提案した戦略が実行されたか、対象KPIが動いたかを検証し、続行/修正/取り下げを判断する。これを毎月必ず行うことで提案の精度を上げる。",
     "strategies から status IN ('proposed','adopted') の行を取り出し、target_metric の baseline_value と当月値を比較。改善していれば adopted→done、動いていなければ原因を推定して修正案を出す。検証結果は outcome_value / outcome_note に必ず書き戻す。",
     "hpb-strategist"),
    ("exposure_benchmark_shift", "露出量の断絶とベンチマーク母集団の変化の分離", "competitor",
     "Salon Reportの『エリア平均』は同エリア・同プランのサロンの平均なので、掲載プランを変えると"
     "比較相手そのものが入れ替わる。対平均比の改善が実力の改善なのか母集団の入れ替えなのかを分離する。"
     "これを見逃すと、悪化しているのに『改善した』と誤読する。",
     "hpb_monthly_kpi を月順に並べ、plan が切り替わった月を検出する。その前後で "
     "(a)自店の絶対値（pv_total, customers_new など）の変化率 と "
     "(b)エリア平均（pv_total_avg など）の変化率 を別々に算出する。"
     "両者の符号や大きさが食い違う月は、対平均比の増減を実力の変化として語ってはいけない。"
     "該当月には必ず warning 以上の finding を立て、前年同月比か絶対値での判断に切り替えるよう明記する。",
     "hpb-analyst-market"),
    ("page_shelf_audit", "実ページのクーポン棚の点検", "page",
     "お客さまが実際に見ているクーポン一覧が、選べる状態になっているかを点検する。"
     "レポートの「本数」だけでは、ダミー行・重複・命名の混在・並び順の問題は一切見えない。",
     "page_observations の surface='coupon' を position 順に並べ、次を数える。"
     "(1) 価格が無い見出し用のダミー行は何本か（本数カウントから除外して実質本数を出す）。"
     "(2) 同じ構成のクーポンが何本重複しているか。ラベル違い・価格違いも含める。"
     "(3) 命名の体系が何種類混在しているか（悩み起点型／メニュー名＋定価取り消し型など）。"
     "(4) 予約を取りたいクーポンが何番目にあるか。2ページ目に埋もれていないか。"
     "(5) ラベル（新規/再来/全員）と説明文の条件が矛盾していないか。"
     "並び替えと表示名の変更は管理画面の操作だけで当日反映されるため、費用対効果が最も高い。",
     "hpb-strategist-page"),
    ("page_freshness_gap", "更新の鮮度と競合との差", "page",
     "口コミ・ブログ・スタイルが「いつ止まっているか」を競合と並べて見る。"
     "件数が同じでも、止まっている店と積み上がっている店では新規からの見え方が全く違う。",
     "page_observations から自店と競合の最新投稿日を取り、観察日からの経過日数を出す。"
     "★口コミ一覧は投稿日の降順に並んでいないので、**全件の投稿日の最大値**を取ること"
     "（先頭の日付を最新と読むと必ず誤る）。"
     "自店と競合の (件数, 最新日からの経過日数, 直近7日の増加数) を並べ、"
     "差が開き続けているのか縮まっているのかを判定する。",
     "hpb-page-scout"),
    ("review_generation_ops", "口コミを仕組みで増やす運用設計", "strategy",
     "口コミ件数は初回予約の判断材料として効くが、意欲ではなく手順の有無で増減が決まる。"
     "誰が・いつ・どう依頼するかを設計し、続く形にする。",
     "hpb_competitor_stats の reviews で自店と比較サロンの口コミ件数差を出し、"
     "hpb_monthly_kpi の review_posts の月次推移から『続いているか、単発で止まっているか』を判定する。"
     "そのうえで依頼の接点（会計時・メッセージ・マイページ）ごとに、"
     "守り／標準／攻めの3スタンスで運用手順を設計する。"
     "各案には記録方法（何を数えるか）と週次の確認手順を必ず含める。"
     "攻めの案には撤退条件（何ヶ月・どの数字を下回ったらやめるか）を付ける。",
     "hpb-strategist-ops"),
    ("posting_cadence_ops", "投稿の継続を仕組みにする", "strategy",
     "ブログ・スタイル写真は投稿量が集客に効くが、担当と締切が決まっていないと必ず止まる。"
     "続く頻度に落とし込むのがこの手法の目的。",
     "hpb_monthly_kpi の blog_posts / style_count / review_posts の月次推移を見て、"
     "『ある月だけ多くて後は止まっている』形になっていないかを確認する。"
     "止まっている場合は意欲ではなく仕組みの欠如とみなし、"
     "担当者・曜日・本数・ネタの用意方法まで決めた運用案を守り／標準／攻めの3スタンスで出す。"
     "内容やタイトルの良し悪しは hpb-strategist-creative の領分なので踏み込まない。",
     "hpb-strategist-ops"),
]


def check_tables(con):
    missing = [t for t in KPI_TABLES if not con.execute(
        "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=%s",
        (t,)).fetchone()]
    if missing:
        sys.exit(f"未作成のテーブル: {', '.join(missing)}\n"
                 "supabase/migrations/0027_kpi_analysis.sql を Supabase の SQL Editor で実行してください。")


def migrate_history(con, store):
    path = DATA_DIR / store / "history.json"
    if not path.exists():
        return 0
    hist = json.loads(path.read_text(encoding="utf-8"))
    n = 0
    for month, m in hist.get("months", {}).items():
        pv = m.get("pv", {}) or {}
        r = m.get("reservations", {}) or {}
        c = m.get("customers", {}) or {}
        sh = m.get("shimei", {}) or {}
        cu = m.get("coupon_use", {}) or {}
        g = m.get("gender_pct", {}) or {}
        a = m.get("age_pct", {}) or {}
        d = m.get("device", {}) or {}
        ct = m.get("content", {}) or {}
        upsert(con, "hpb_monthly_kpi", {"store": store, "month": month}, {
            "plan": m.get("plan"),
            "net_reservations": r.get("net"), "tel_visits": r.get("tel"),
            "unit_price_yen": m.get("unit_price_yen"), "sales_man_yen": m.get("sales_man_yen"),
            "customers_new": c.get("new"), "customers_repeat": c.get("repeat"),
            "shimei_with": sh.get("with"), "shimei_without": sh.get("without"),
            "coupon_with": cu.get("with"), "coupon_without": cu.get("without"),
            "coupon_message": cu.get("message"),
            "pv_total": pv.get("total"), "pv_total_avg": pv.get("total_avg"),
            "pv_salon": pv.get("salon"), "pv_salon_avg": pv.get("salon_avg"),
            "pv_kodawari": pv.get("kodawari"), "pv_kodawari_avg": pv.get("kodawari_avg"),
            "pv_style_detail": pv.get("style_detail"),
            "pv_style_detail_avg": pv.get("style_detail_avg"),
            "pv_coupon_menu": pv.get("coupon_menu"),
            "pv_coupon_menu_avg": pv.get("coupon_menu_avg"),
            "pv_coupon_print": pv.get("coupon_print"),
            "pv_coupon_print_avg": pv.get("coupon_print_avg"),
            "pv_reserve_done": pv.get("reserve_done"),
            "pv_reserve_done_avg": pv.get("reserve_done_avg"),
            "cvr": (m.get("cvr_pct") or {}).get("own"),
            "cvr_avg": (m.get("cvr_pct") or {}).get("avg"),
            "acr": (m.get("acr_pct") or {}).get("own"),
            "acr_avg": (m.get("acr_pct") or {}).get("avg"),
            "new_repeat_rate": m.get("new_repeat_rate_pct"),
            "female_rate": g.get("female"), "male_rate": g.get("male"),
            "age_u20": a.get("u20"), "age_20s": a.get("20s"), "age_30s": a.get("30s"),
            "age_40s": a.get("40s"), "age_50plus": a.get("50plus"),
            "device_pc": d.get("pc"), "device_mb": d.get("mb"), "device_sp": d.get("sp_app"),
            "blog_posts": ct.get("blog_posts"), "blog_views": ct.get("blog_views"),
            "blog_views_avg": ct.get("blog_views_avg"),
            "blog_coupon_posts": ct.get("blog_coupon_posts"),
            "blog_coupon_clicks": ct.get("blog_coupon_clicks"),
            "blog_coupon_clicks_avg": ct.get("blog_coupon_clicks_avg"),
            "review_posts": ct.get("review_posts"), "review_views": ct.get("review_views"),
            "review_views_avg": ct.get("review_views_avg"),
            "style_count": ct.get("style_count"),
            "tel_screen_pv": ct.get("tel_screen_pv"), "tel_calls": ct.get("tel_calls"),
            "mypage_users": ct.get("mypage_users"),
            "source": "salon_report",
        })
        n += 1
    con.commit()
    return n


def apply_plan_costs(con, store, cost_map):
    if not cost_map:
        return
    for plan, cost in cost_map.items():
        con.execute("UPDATE hpb_monthly_kpi SET plan_cost_yen=%s WHERE store=%s AND plan=%s",
                    (cost, store, plan))
    con.commit()


def register_roster(con):
    for (agent, name, kana, age, role, team, icon, phrase, color, order) in ROSTER:
        upsert(con, "agent_roster", {"agent": agent}, {
            "display_name": name, "kana": kana, "age": age, "role_title": role, "team": team,
            "icon": icon, "catchphrase": phrase, "color": color, "channel": "hpb",
            "sort_order": order,
        })
    con.commit()
    print(f"チーム名簿: {len(ROSTER)}人を登録しました")


def register_stores(con, config):
    stores = config.get("stores", {})
    if not stores:
        existing = con.execute("SELECT code FROM stores").fetchall()
        if not existing:
            print("⚠ 店舗が未登録です。scripts/hpb/config.example.json を config.json にコピーして"
                  "店舗情報を書き込んでから再実行してください。")
        return 0
    total = 0
    for code, s in stores.items():
        upsert(con, "stores", {"code": code}, {
            "name": s.get("name", code), "genre": s.get("genre"),
            "hpb_cd": s.get("hpb_cd"), "area": s.get("area"),
            "sub_area": s.get("sub_area"), "seats": s.get("seats"),
            "plan_cost_yen": s.get("plan_cost_yen") or {},
            "plan_cost_note": s.get("plan_cost_note"),
            "variable_cost_rate": s.get("variable_cost_rate"),
            "notes": s.get("notes"), "active": True,
        })
        con.commit()
        n = migrate_history(con, code)
        apply_plan_costs(con, code, s.get("plan_cost_yen"))
        total += n
        print(f"  {code}: 店舗を登録し {n}ヶ月分を hpb_monthly_kpi へ取り込み")
    return total


def main():
    con = connect()
    check_tables(con)
    register_roster(con)
    register_stores(con, load_config())

    existing = {r["code"] for r in con.execute("SELECT code FROM analysis_methods")}
    added = 0
    for code, name, cat, desc, proc, owner in SEED_METHODS:
        register_method(con, code, name, cat, desc, proc, owner, backfill_needed=False)
        con.execute("UPDATE analysis_methods SET category=%s, owner_agent=%s WHERE code=%s",
                    (cat, owner, code))
        if code not in existing:
            added += 1
    con.commit()
    print(f"分析手法レジストリ: 新規{added}件 / 定義更新{len(SEED_METHODS)}件 "
          f"（既存 {len(existing)}件）")
    print("完了")


if __name__ == "__main__":
    main()
