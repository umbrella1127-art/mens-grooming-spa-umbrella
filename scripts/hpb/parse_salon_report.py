# -*- coding: utf-8 -*-
"""HPB Salon Report PDF (ページ①) から月次KPIを抽出し history.json にマージする。

使い方:
    python scripts/hpb/parse_salon_report.py <SalonReport.pdf> [--store <store>]

- 13ヶ月分のKPI（予約・売上・PV・CVR/ACR・顧客構成など）を抽出
- data/hpb/<store>/history.json に月キー(YYYY-MM)でマージ（同月は上書き＝冪等）
- 抽出後に整合チェックを行い、結果サマリを標準出力に出す

レイアウト上の注意:
- ページ①は左表(ご集客/ご予約データ)と右表(サイト閲覧)が横に並んでおり、
  1行のテキストに両方の系列が入る。行内をラベル位置で分割して対応づける。
- 「同プラン、同エリア平均」行は複数あるため、直前に出現した親ラベルに割り当てる。
"""
import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import pdfplumber

# Windowsの既定コンソール(cp932)で日本語出力が化けないようUTF-8に固定する
for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DATA_DIR = PROJECT_ROOT / "data" / "hpb"
N_MONTHS = 13

NUM_RE = r"[\d,]+(?:\.\d+)?%?|ー"


def _to_num(tok):
    if tok in ("ー", "-", ""):
        return None
    tok = tok.replace(",", "")
    if tok.endswith("%"):
        return float(tok[:-1])
    if "." in tok:
        return float(tok)
    return int(tok)


def build_lines(page):
    """単語をtop座標の近さ(3pt)でクラスタリングして行テキストを返す。"""
    words = sorted(page.extract_words(x_tolerance=1.5, y_tolerance=1.5),
                   key=lambda w: w["top"])
    groups = []
    for w in words:
        if groups and abs(w["top"] - groups[-1][0][-1]["top"]) <= 3:
            groups[-1][0].append(w)
        else:
            groups.append(([w],))
    lines = []
    for (ws,) in groups:
        ws = sorted(ws, key=lambda w: w["x0"])
        lines.append(" ".join(w["text"] for w in ws))
    return lines


# 抽出対象ラベル。avg_of がある名前は「同プラン、同エリア平均」の親になり得る。
LABELS = [
    ("net_reservations",    r"NET予約数"),
    ("tel_visits",          r"TEL予約・直接来店数"),
    ("net_unit_price",      r"NET単価"),
    ("net_sales",           r"NET予約売上"),
    ("pv_total",            r"総PV数"),
    ("pv_salon",            r"サロン情報\s*PV数"),
    ("pv_kodawari",         r"こだわり\s*PV数"),
    ("pv_style",            r"ｽﾀｲﾙ詳細\s*PV数"),
    ("pv_coupon_menu",      r"ｸｰﾎﾟﾝﾒﾆｭｰﾍﾟｰｼﾞ\s*PV数"),
    ("pv_coupon_print",     r"ｸｰﾎﾟﾝ印刷\s*PV数"),
    ("pv_reserve_done",     r"予約完了\s*PV数"),
    ("cvr",                 r"CVR（ｸｰﾒﾆｭｰ/TOP）\*?"),
    ("acr",                 r"ACR（予約完了/ｸｰﾒﾆｭｰ）\*?"),
    ("blog_posts",          r"ﾌﾞﾛｸﾞ投稿数"),
    ("blog_views",          r"ﾌﾞﾛｸﾞ閲覧数"),
    ("blog_coupon_posts",   r"ｸｰﾎﾟﾝ付ﾌﾞﾛｸﾞ投稿数"),
    ("blog_coupon_clicks",  r"ﾌﾞﾛｸﾞｸｰﾎﾟﾝｸﾘｯｸ数"),
    ("review_posts",        r"口ｺﾐ投稿数"),
    ("review_views",        r"口ｺﾐ閲覧数"),
    ("style_count",         r"ｽﾀｲﾙ数"),
    ("tel_screen_pv",       r"電話番号画面PV数\s*(?:\(PC・SP・アプリ\))?"),
    ("tel_calls",           r"電話発信回数\s*(?:\(SP・アプリ\))?"),
    ("mypage_users",        r"ﾏｲﾍﾟｰｼﾞ登録者数"),
    ("device_pc",           r"PC予約者数"),
    ("device_mb",           r"MB予約者数"),
    ("device_sp",           r"SP・アプリ予約者数"),
    ("shimei_with",         r"指名あり"),
    ("shimei_without",      r"指名なし"),
    ("coupon_message",      r"Mクーポンあり"),
    ("coupon_with",         r"クーポンあり"),
    ("coupon_without",      r"クーポンなし"),
    ("female_rate",         r"女性率"),
    ("male_rate",           r"男性率"),
    ("age_u20",             r"20才未満率"),
    ("age_20s",             r"20代率"),
    ("age_30s",             r"30代率"),
    ("age_40s",             r"40代率"),
    ("age_50plus",          r"50才以上率"),
    ("new_repeat_rate",     r"新規リピート率\*?"),
    ("_avg",                r"同プラン、同エリア平均"),
]

# 「同プラン、同エリア平均」を持つ親ラベル
HAS_AVG = {
    "pv_total", "pv_salon", "pv_kodawari", "pv_style", "pv_coupon_menu",
    "pv_coupon_print", "pv_reserve_done", "cvr", "acr",
    "blog_views", "blog_coupon_clicks", "review_views",
}

PLAN_WORDS = ("シンプル", "ライト", "バリュー", "プラチナ", "NR")


def extract_series(lines):
    """全ラベル系列を {name: [13values]} で返す。"""
    compiled = [(name, re.compile(pat)) for name, pat in LABELS]
    series = {}
    last_avg_parent = None  # 次に出る「同エリア平均」の親

    for ln in lines:
        # 行内のラベル出現位置を列挙し、位置順にソート
        hits = []
        for name, pat in compiled:
            for m in pat.finditer(ln):
                hits.append((m.start(), m.end(), name))
        if not hits:
            continue
        hits.sort()
        # 重なり除去（例: クーポンあり と Mクーポンあり）
        filtered = []
        for h in hits:
            if filtered and h[0] < filtered[-1][1]:
                continue
            filtered.append(h)
        for idx, (s, e, name) in enumerate(filtered):
            seg_end = filtered[idx + 1][0] if idx + 1 < len(filtered) else len(ln)
            toks = re.findall(NUM_RE, ln[e:seg_end])
            if len(toks) < N_MONTHS:
                # ラベルだけの行（グラフ凡例など）は無視
                if name in HAS_AVG and len(toks) == 0:
                    continue
                if name != "_avg":
                    continue
            vals = [_to_num(t) for t in toks[:N_MONTHS]] if len(toks) >= N_MONTHS else None
            if name == "_avg":
                if vals is not None and last_avg_parent and \
                        f"{last_avg_parent}_avg" not in series:
                    series[f"{last_avg_parent}_avg"] = vals
                continue
            if name not in series and vals is not None:
                series[name] = vals
            if name in HAS_AVG:
                last_avg_parent = name
    return series


def find_plan_series(lines):
    for ln in lines:
        if "プラン" in ln and any(w in ln for w in PLAN_WORDS):
            body = ln.split("プラン", 1)[1]
            toks = re.findall("|".join(PLAN_WORDS), body)
            if len(toks) >= N_MONTHS:
                return toks[:N_MONTHS]
    return None


def find_customers(page):
    """新規/リピーター行を単語座標から復元する（縦書きヘッダと重なるため専用処理）。

    ページ左下領域で「純粋な整数が13個以上並ぶ行」の最後の2本が新規/リピーター。
    """
    words = page.extract_words(x_tolerance=1.5, y_tolerance=0.5)
    rows = {}
    for w in words:
        if re.fullmatch(r"\d{1,3}", w["text"]):
            rows.setdefault(round(w["top"]), []).append(w)
    # 近接top(±2)をまとめる
    merged = []
    for key in sorted(rows):
        if merged and key - merged[-1][0] <= 2:
            merged[-1] = (key, merged[-1][1] + rows[key])
        else:
            merged.append((key, list(rows[key])))
    candidates = []
    for key, ws in merged:
        ws = sorted(ws, key=lambda w: w["x0"])
        if len(ws) >= N_MONTHS:
            candidates.append((key, [int(w["text"]) for w in ws[:N_MONTHS]]))
    if len(candidates) >= 2:
        return candidates[-2][1], candidates[-1][1]
    return None, None


def issue_month(lines):
    for ln in lines[:10]:
        m = re.search(r"ご掲載月号\s*(\d{2})(\d{2})月号", ln)
        if m:
            return 2000 + int(m.group(1)), int(m.group(2))
    raise ValueError("ご掲載月号が見つかりません")


def month_keys(latest_year, latest_month):
    keys = []
    y, mo = latest_year, latest_month
    for _ in range(N_MONTHS):
        keys.append(f"{y:04d}-{mo:02d}")
        mo -= 1
        if mo == 0:
            y, mo = y - 1, 12
    return list(reversed(keys))


def find_area_plan_counts(lines):
    text = "\n".join(lines)
    out = {}
    for m in re.finditer(r"(プラチナ|バリュー|シンプル|ライト|NR)\s+(\d+)\s+([\d.]+)%", text):
        out[m.group(1)] = {"count": int(m.group(2)), "share_pct": float(m.group(3))}
    m = re.search(r"ＡＬＬ\s+(\d+)", text)
    if m:
        out["ALL"] = {"count": int(m.group(1))}
    return out or None


def extract_page1(page):
    lines = build_lines(page)
    latest = issue_month(lines)
    keys = month_keys(*latest)

    series = extract_series(lines)
    series["plan"] = find_plan_series(lines)
    new_vals, rep_vals = find_customers(page)
    series["customers_new"] = new_vals
    series["customers_repeat"] = rep_vals

    months = {}
    for i, key in enumerate(keys):
        def v(name):
            s = series.get(name)
            return s[i] if s else None

        months[key] = {
            "plan": v("plan"),
            "reservations": {"net": v("net_reservations"), "tel": v("tel_visits")},
            "unit_price_yen": v("net_unit_price"),
            "sales_man_yen": v("net_sales"),
            "pv": {
                "total": v("pv_total"), "total_avg": v("pv_total_avg"),
                "salon": v("pv_salon"), "salon_avg": v("pv_salon_avg"),
                "kodawari": v("pv_kodawari"), "kodawari_avg": v("pv_kodawari_avg"),
                "style_detail": v("pv_style"), "style_detail_avg": v("pv_style_avg"),
                "coupon_menu": v("pv_coupon_menu"), "coupon_menu_avg": v("pv_coupon_menu_avg"),
                "coupon_print": v("pv_coupon_print"), "coupon_print_avg": v("pv_coupon_print_avg"),
                "reserve_done": v("pv_reserve_done"), "reserve_done_avg": v("pv_reserve_done_avg"),
            },
            "cvr_pct": {"own": v("cvr"), "avg": v("cvr_avg")},
            "acr_pct": {"own": v("acr"), "avg": v("acr_avg")},
            "device": {"pc": v("device_pc"), "mb": v("device_mb"), "sp_app": v("device_sp")},
            "shimei": {"with": v("shimei_with"), "without": v("shimei_without")},
            "coupon_use": {
                "with": v("coupon_with"), "without": v("coupon_without"),
                "message": v("coupon_message"),
            },
            "gender_pct": {"female": v("female_rate"), "male": v("male_rate")},
            "age_pct": {
                "u20": v("age_u20"), "20s": v("age_20s"), "30s": v("age_30s"),
                "40s": v("age_40s"), "50plus": v("age_50plus"),
            },
            "customers": {"new": v("customers_new"), "repeat": v("customers_repeat")},
            "new_repeat_rate_pct": v("new_repeat_rate"),
            "content": {
                "blog_posts": v("blog_posts"),
                "blog_views": v("blog_views"), "blog_views_avg": v("blog_views_avg"),
                "blog_coupon_posts": v("blog_coupon_posts"),
                "blog_coupon_clicks": v("blog_coupon_clicks"),
                "blog_coupon_clicks_avg": v("blog_coupon_clicks_avg"),
                "review_posts": v("review_posts"),
                "review_views": v("review_views"), "review_views_avg": v("review_views_avg"),
                "style_count": v("style_count"),
                "tel_screen_pv": v("tel_screen_pv"), "tel_calls": v("tel_calls"),
                "mypage_users": v("mypage_users"),
            },
        }

    meta = {
        "latest_issue": keys[-1],
        "area_plan_counts": find_area_plan_counts(lines),
    }
    return months, meta, series


def validate(months, series):
    problems = []
    required = ["net_reservations", "net_sales", "pv_total", "pv_salon",
                "pv_coupon_menu", "pv_reserve_done", "cvr", "acr",
                "customers_new", "customers_repeat"]
    for name in required:
        if series.get(name) is None:
            problems.append(f"必須系列が抽出できません: {name}")
    for key, m in months.items():
        for label, pct in (("CVR", m["cvr_pct"]["own"]), ("ACR", m["acr_pct"]["own"])):
            if pct is not None and not (0 <= pct <= 100):
                problems.append(f"{key}: {label}が範囲外 ({pct})")
        c, r = m["customers"], m["reservations"]
        if None not in (c["new"], c["repeat"], r["net"], r["tel"]):
            if c["new"] + c["repeat"] != r["net"] + r["tel"]:
                problems.append(
                    f"{key}: 新規+リピーター({c['new']}+{c['repeat']})が"
                    f"予約合計({r['net']}+{r['tel']})と不一致")
    return problems


def merge_history(store, months, meta):
    hist_path = DATA_DIR / store / "history.json"
    if hist_path.exists():
        hist = json.loads(hist_path.read_text(encoding="utf-8"))
    else:
        hist = {"store": store, "months": {}}
    hist["months"].update(months)
    hist["months"] = dict(sorted(hist["months"].items()))
    hist["updated"] = datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")
    hist["latest_issue"] = meta["latest_issue"]
    if meta.get("area_plan_counts"):
        hist["area_plan_counts"] = meta["area_plan_counts"]
    hist_path.parent.mkdir(parents=True, exist_ok=True)
    hist_path.write_text(json.dumps(hist, ensure_ascii=False, indent=2), encoding="utf-8")
    return hist_path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("pdf")
    ap.add_argument("--store", required=True)
    args = ap.parse_args()

    with pdfplumber.open(args.pdf) as pdf:
        months, meta, series = extract_page1(pdf.pages[0])

    problems = validate(months, series)
    path = merge_history(args.store, months, meta)

    latest = meta["latest_issue"]
    lm = months[latest]
    print(f"OK: {len(months)}ヶ月分を抽出し {path} にマージしました（最新: {latest}）")
    print(f"  最新月KPI: NET予約 {lm['reservations']['net']}件 / 売上 {lm['sales_man_yen']}万円 "
          f"/ CVR {lm['cvr_pct']['own']}% / ACR {lm['acr_pct']['own']}%")
    if problems:
        print("警告:")
        for p in problems:
            print(f"  - {p}")
        sys.exit(2)


if __name__ == "__main__":
    main()
