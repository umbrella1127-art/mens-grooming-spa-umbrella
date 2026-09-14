# -*- coding: utf-8 -*-
"""Salon Report PDF のページ③〜⑧からコンテンツ明細を抽出してDBへ格納する。

    python scripts/hpb/extract_content.py <SalonReport.pdf> --store <store>

抽出対象:
  ③ 特集ご参画数・クリック数        → hpb_feature_stats
  ④ 特集クーポンクリック数          → hpb_feature_coupon_clicks
  ⑤ ブログクーポンクリック数        → hpb_blog_effects       ★どのブログが集客したか
  ⑦ スタイル閲覧/ブックマークランキング → hpb_style_stats / stylist_stats
  ⑧ スタイリスト別・クーポン別ネット予約数 → hpb_coupon_stats / stylist_stats

抽出しきれない部分は、コンテンツ分析担当がPDFを直接読んで
`python scripts/hpb/db_put.py` で補完する運用。
"""
import argparse
import re
import sys
from pathlib import Path

import pdfplumber

sys.path.insert(0, str(Path(__file__).resolve().parent))
from hpb_db import connect, upsert  # noqa: E402

INT_RE = re.compile(r"^\d{1,5}$")
PCT_RE = re.compile(r"^([\d.]+)%$")
PRICE_RE = re.compile(r"[¥￥\\]\s?([\d,]+)")


def cluster_rows(words, gap=6.0):
    """top座標の近い単語をまとめて行にする。

    ラベルと数値がy方向に3px程度ずれる表があるため単純な同値比較では行にならない。
    ただし「直前の単語との差」で連結すると数値が数珠つなぎになって隣の行まで
    飲み込むので、必ず「クラスタ先頭からの距離」で判定する。
    """
    ws = sorted(words, key=lambda w: w["top"])
    rows, cur, anchor = [], [], None
    for w in ws:
        if anchor is not None and w["top"] - anchor > gap:
            rows.append(cur)
            cur, anchor = [], None
        if anchor is None:
            anchor = w["top"]
        cur.append(w)
    if cur:
        rows.append(cur)
    return [sorted(r, key=lambda w: w["x0"]) for r in rows]


def center(w):
    return (w["x0"] + w["x1"]) / 2


def find_header(rows, *labels):
    """指定ラベルをすべて含む行を探し、{ラベル: 中心x} を返す。"""
    for r in rows:
        texts = {w["text"]: w for w in r}
        if all(any(t.startswith(l) for t in texts) for l in labels):
            out = {}
            for l in labels:
                for t, w in texts.items():
                    if t.startswith(l):
                        out.setdefault(l, center(w))
            if len(out) == len(labels):
                return out, r
    return None, None


def assign_columns(tokens, col_anchors, max_dist=28, align="center"):
    """トークンを最も近い列に排他的に割り当てる。

    align="right" は数値が右揃えの列で使う。ヘッダラベルの中心と数値の中心は
    桁数によってずれるため、右端どうしを突き合わせた方が正確に一致する。
    """
    def pos(w):
        return w["x1"] if align == "right" else center(w)

    out = {}
    for w in tokens:
        c = pos(w)
        best, bd = None, 1e9
        for name, cx in col_anchors.items():
            d = abs(c - cx)
            if d < bd:
                best, bd = name, d
        if best is not None and bd <= max_dist:
            out.setdefault(best, []).append(w)
    return out


def issue_month(pdf):
    text = pdf.pages[0].extract_text() or ""
    m = re.search(r"ご掲載月号\s*(\d{2})(\d{2})月号", text)
    if not m:
        raise ValueError("ご掲載月号が読み取れません")
    return 2000 + int(m.group(1)), int(m.group(2))


def month_key(y, mo):
    return f"{y:04d}-{mo:02d}"


def prev_months(y, mo, n):
    """最新月から遡ってn個の月キー（古い順）。"""
    keys = []
    for _ in range(n):
        keys.append(month_key(y, mo))
        mo -= 1
        if mo == 0:
            y, mo = y - 1, 12
    return list(reversed(keys))


# -------- 3ヶ月横並びテーブルの共通パーサ（⑤ブログ・④特集クーポン） --------

def extract_3col_table(page, months, left_label, right_label,
                       section=None, next_section=None):
    """「04月号|05月号|06月号」が横に並び、各列が [左項目 / クーポン名 / クリック数]
    という構造のテーブルを抽出する共通処理。

    section を指定すると、その見出し行より下・next_section より上に限定する。
    戻り値: [{month, left, right, clicks}, ...]
    """
    rows = cluster_rows(page.extract_words(x_tolerance=1.5, y_tolerance=1.5))

    lo_y, hi_y = -1e9, 1e9
    if section:
        for r in rows:
            joined = "".join(w["text"] for w in r)
            if section in joined:
                lo_y = max(w["bottom"] for w in r)
                break
        else:
            return []
    if next_section:
        for r in rows:
            joined = "".join(w["text"] for w in r)
            if next_section in joined and min(w["top"] for w in r) > lo_y:
                hi_y = min(w["top"] for w in r)
                break
    rows = [r for r in rows if lo_y < min(w["top"] for w in r) < hi_y]

    band_starts = []
    for r in rows:
        hits = [w for w in r if re.fullmatch(r"\d{2}月号", w["text"])]
        if len(hits) >= 2:
            band_starts = [w["x0"] for w in sorted(hits, key=lambda w: w["x0"])]
            break
    if not band_starts:
        return []

    hdr = None
    for r in rows:
        if sum(1 for w in r if w["text"].startswith(left_label)) >= 2:
            hdr = r
            break
    if not hdr:
        return []
    lefts = sorted(center(w) for w in hdr if w["text"].startswith(left_label))
    rights = sorted(center(w) for w in hdr if w["text"].startswith(right_label))
    n = len(band_starts)
    if len(lefts) != n or len(rights) != n:
        return []
    bounds = [(lefts[i] + rights[i]) / 2 for i in range(n)]
    edges = [s - 6 for s in band_starts] + [1e9]
    hdr_bottom = max(w["bottom"] for w in hdr)

    out = []
    for r in rows:
        if min(w["top"] for w in r) <= hdr_bottom:
            continue
        for i in range(n):
            band = [w for w in r if edges[i] <= w["x0"] < edges[i + 1]]
            if not band:
                continue
            nums = [w for w in band if INT_RE.match(w["text"])]
            clicks = None
            if nums and center(nums[-1]) > bounds[i]:
                clicks = int(nums[-1]["text"])
                band = [w for w in band if w is not nums[-1]]
            left = "".join(w["text"] for w in band if center(w) < bounds[i]).strip()
            right = " ".join(w["text"] for w in band if center(w) >= bounds[i]).strip()
            if left and clicks is not None:
                out.append({"month": months[i], "left": left,
                            "right": right or None, "clicks": clicks})
    return out


# ---------------- ⑤ ブログクーポンクリック（最重要） ----------------

def extract_blogs(page, months):
    recs = extract_3col_table(page, months, "ブログタイトル", "クーポン名")
    return [{"month": r["month"], "blog_title": r["left"],
             "coupon_name": r["right"], "clicks": r["clicks"]} for r in recs]


# ---------------- ③ 特集ご参画数・クリック数 ----------------

FEATURE_COLS = ["参画数", "PC閲覧率", "PC平均", "PC貴店", "PC最大",
                "SP閲覧率", "SP平均", "SP貴店", "SP最大"]
GENRES = {"メニュー", "ヘアケア", "カウンセリング", "サロンの雰囲気", "サロンの特徴",
          "プライス", "ヘアセット・着付け", "メンズ", "カウンセ", "リング"}


def extract_features(page, month):
    rows = cluster_rows(page.extract_words(x_tolerance=1.5, y_tolerance=1.5), gap=5.0)
    hdr, hdr_row = None, None
    for r in rows:
        names = [w["text"] for w in r]
        if names.count("SP最大") == 1 and "PC閲覧率" in names and "参画数" in names:
            # 最終月号（右端）のブロックだけを使う
            cols = {}
            for label in FEATURE_COLS:
                cands = [w for w in r if w["text"] == label]
                if cands:
                    cols[label] = center(max(cands, key=lambda w: w["x0"]))
            if len(cols) >= 7:
                hdr, hdr_row = cols, r
                break
    if not hdr:
        return []

    right_start = min(hdr.values()) - 20
    hdr_bottom = max(w["bottom"] for w in hdr_row)
    out = []
    for r in rows:
        if min(w["top"] for w in r) <= hdr_bottom:
            continue
        # 特集名は左端（ジャンル列とデータ列の間）にあり、右端にも複製されている。
        # 最初の月号のデータ列（PC平均）より左だけを名前として拾う。
        name_tokens = [w for w in r if 40 <= w["x0"] < 118
                       and w["text"] not in GENRES and not INT_RE.match(w["text"])
                       and not PCT_RE.match(w["text"])]
        name = "".join(w["text"] for w in name_tokens).strip()
        if not name or len(name) < 4:
            continue
        genre_tok = [w for w in r if w["x0"] < 40]
        genre = "".join(w["text"] for w in genre_tok).strip() or None
        vals = assign_columns([w for w in r if w["x0"] >= right_start], hdr, max_dist=22)

        def num(label, pct=False):
            ws = vals.get(label)
            if not ws:
                return None
            t = ws[0]["text"]
            m = PCT_RE.match(t)
            if m:
                return float(m.group(1))
            return float(t.replace(",", "")) if pct else (
                int(t.replace(",", "")) if INT_RE.match(t.replace(",", "")) else None)

        rec = {"month": month, "feature_name": name, "genre": genre,
               "participants": num("参画数"),
               "view_rate": num("SP閲覧率", pct=True),
               "own_clicks": num("SP貴店"),
               "avg_clicks": num("SP平均", pct=True),
               "max_clicks": num("SP最大")}
        if any(v is not None for k, v in rec.items() if k not in ("month", "feature_name", "genre")):
            out.append(rec)
    return out


# ---------------- ④ 特集クーポンクリック ----------------

def extract_feature_coupons(page, months):
    recs = extract_3col_table(page, months, "特集名", "クーポン名",
                              section="■特集クーポンクリック数",
                              next_section="■こだわりクーポンクリック数")
    return [{"month": r["month"], "feature_name": r["left"],
             "coupon_name": r["right"], "clicks": r["clicks"]}
            for r in recs if r["right"]]


# ---------------- ⑦ スタイル閲覧・ブックマーク ----------------

def extract_styles(page, month):
    rows = cluster_rows(page.extract_words(x_tolerance=1.5, y_tolerance=1.5))
    # スタイル閲覧ランキング: 「スタイル名 掲載No 閲覧数」が2組
    hdr = None
    for r in rows:
        if sum(1 for w in r if w["text"] == "閲覧数") >= 2:
            hdr = r
            break
    styles = []
    if hdr:
        views = sorted([w for w in hdr if w["text"] == "閲覧数"], key=lambda w: w["x0"])
        nos = sorted([w for w in hdr if w["text"] == "掲載No"], key=lambda w: w["x0"])
        nos = [w for w in nos if w["x0"] > 600]
        names = sorted([w for w in hdr if w["text"] == "スタイル名"], key=lambda w: w["x0"])
        names = [w for w in names if w["x0"] > 600]
        hdr_bottom = max(w["bottom"] for w in hdr)
        if len(views) == len(nos) == len(names):
            for i in range(len(views)):
                lo = names[i]["x0"] - 10
                hi = views[i]["x1"] + 40
                nb = center(nos[i])
                vb = center(views[i])
                for r in rows:
                    if min(w["top"] for w in r) <= hdr_bottom:
                        continue
                    band = [w for w in r if lo <= w["x0"] < hi]
                    if not band:
                        continue
                    nm = "".join(w["text"] for w in band
                                 if center(w) < nb - 15).strip()
                    # 掲載No と 閲覧数 は列が近接し数値が右揃えなので右端で判定する
                    cols = assign_columns([w for w in band if center(w) >= nb - 25
                                           and INT_RE.match(w["text"])],
                                          {"no": nos[i]["x1"], "views": views[i]["x1"]},
                                          max_dist=26, align="right")
                    no = int(cols["no"][0]["text"]) if cols.get("no") else None
                    vw = int(cols["views"][0]["text"]) if cols.get("views") else None
                    if nm and vw is not None:
                        styles.append({"month": month, "style_name": nm,
                                       "listing_no": no, "views": vw})
    # ブックマークスタイル（累積）: スタイル名 掲載No スタイリスト名 登録数
    bm = {}
    hdr2 = None
    for r in rows:
        txts = [w["text"] for w in r]
        if txts.count("スタイリスト名") >= 1 and "登録数" in txts and "掲載No" in txts:
            hdr2 = r
            break
    if hdr2:
        no_w = min((w for w in hdr2 if w["text"] == "掲載No"), key=lambda w: w["x0"])
        reg_w = min((w for w in hdr2 if w["text"] == "登録数"), key=lambda w: w["x0"])
        c_no, c_reg = center(no_w), center(reg_w)
        c_sty = min(center(w) for w in hdr2 if w["text"] == "スタイリスト名")
        hdr_bottom = max(w["bottom"] for w in hdr2)
        for r in rows:
            if min(w["top"] for w in r) <= hdr_bottom:
                continue
            band = [w for w in r if 140 <= w["x0"] < c_reg + 30]
            if not band:
                continue
            nm = "".join(w["text"] for w in band if center(w) < c_no - 18).strip()
            cols = assign_columns([w for w in band if center(w) >= c_no - 25
                                   and INT_RE.match(w["text"])],
                                  {"no": no_w["x1"], "reg": reg_w["x1"]},
                                  max_dist=26, align="right")
            no = int(cols["no"][0]["text"]) if cols.get("no") else None
            reg = int(cols["reg"][0]["text"]) if cols.get("reg") else None
            sty = "".join(w["text"] for w in band
                          if abs(center(w) - c_sty) <= 50 and not INT_RE.match(w["text"])).strip()
            if nm and reg is not None:
                bm[(nm, no)] = {"bookmarks_total": reg, "stylist": sty or None}
    for s in styles:
        k = (s["style_name"], s["listing_no"])
        if k in bm:
            s.update(bm[k])
    for (nm, no), v in bm.items():
        if not any(s["style_name"] == nm and s["listing_no"] == no for s in styles):
            styles.append({"month": month, "style_name": nm, "listing_no": no, **v})
    return styles


# ---------------- ⑧ クーポン別・スタイリスト別ネット予約数 ----------------

def extract_reservations(page, months):
    rows = cluster_rows(page.extract_words(x_tolerance=1.5, y_tolerance=1.5))
    hdr = None
    for r in rows:
        if sum(1 for w in r if re.fullmatch(r"\d{2}月号", w["text"])) >= 6:
            hdr = r
            break
    if not hdr:
        return [], []
    mon_hdrs = sorted([w for w in hdr if re.fullmatch(r"\d{2}月号", w["text"])],
                      key=lambda w: w["x0"])
    hdr_bottom = max(w["bottom"] for w in hdr)

    # クーポン別（左のクーポン表）: クーポン名ラベルの右にある3つの月号列
    coup_lbl = [w for w in hdr if w["text"].startswith("クーポン名")
                or w["text"].startswith("メッセージクーポン名")]
    coupons = []
    if coup_lbl:
        lbl = min(coup_lbl, key=lambda w: w["x0"])
        cols = [w for w in mon_hdrs if w["x0"] > lbl["x1"]][:3]
        if len(cols) == 3:
            centers = {months[i]: center(cols[i]) for i in range(3)}
            lo, hi = lbl["x0"] - 30, center(cols[-1]) + 40
            for r in rows:
                if min(w["top"] for w in r) <= hdr_bottom:
                    continue
                band = [w for w in r if lo <= w["x0"] < hi]
                if not band:
                    continue
                name_tok = [w for w in band if center(w) < min(centers.values()) - 22]
                name = " ".join(w["text"] for w in name_tok).strip()
                vals = assign_columns([w for w in band
                                       if center(w) >= min(centers.values()) - 22],
                                      centers, max_dist=22)
                if not name:
                    continue
                price = None
                pm = PRICE_RE.search(name)
                if pm:
                    price = int(pm.group(1).replace(",", ""))
                for mk, ws in vals.items():
                    t = ws[0]["text"]
                    if INT_RE.match(t):
                        coupons.append({"month": mk, "coupon_name": name,
                                        "price_yen": price, "reservations": int(t)})

    # スタイリスト別（左端の表）
    stylists = []
    st_lbl = [w for w in hdr if w["text"].startswith("スタイリスト名")]
    if st_lbl:
        lbl = st_lbl[0]
        cols = [w for w in mon_hdrs if lbl["x1"] < w["x0"] < lbl["x1"] + 200][:3]
        if len(cols) == 3:
            centers = {months[i]: center(cols[i]) for i in range(3)}
            for r in rows:
                if min(w["top"] for w in r) <= hdr_bottom:
                    continue
                band = [w for w in r if w["x0"] < center(cols[-1]) + 70]
                if not band:
                    continue
                name = "".join(w["text"] for w in band
                               if center(w) < min(centers.values()) - 25).strip()
                if not name or INT_RE.match(name):
                    continue
                shimei = 1 if any(w["text"] == "可" for w in band) else None
                vals = assign_columns([w for w in band
                                       if center(w) >= min(centers.values()) - 25],
                                      centers, max_dist=20)
                for mk, ws in vals.items():
                    if INT_RE.match(ws[0]["text"]):
                        stylists.append({"month": mk, "stylist": name,
                                         "reservations": int(ws[0]["text"]),
                                         "shimei_available": shimei})
    return coupons, stylists


# ---------------- メイン ----------------

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("pdf")
    ap.add_argument("--store", required=True)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    con = connect()
    counts = {}
    with pdfplumber.open(args.pdf) as pdf:
        y, mo = issue_month(pdf)
        cur = month_key(y, mo)
        m3 = prev_months(y, mo, 3)

        blogs = extract_blogs(pdf.pages[4], m3) if len(pdf.pages) > 4 else []
        feats = extract_features(pdf.pages[2], cur) if len(pdf.pages) > 2 else []
        fcoups = extract_feature_coupons(pdf.pages[3], m3) if len(pdf.pages) > 3 else []
        styles = extract_styles(pdf.pages[6], cur) if len(pdf.pages) > 6 else []
        coupons, stylists = extract_reservations(pdf.pages[7], m3) if len(pdf.pages) > 7 else ([], [])

    def put(table, keys_fn, records):
        for rec in records:
            keys = keys_fn(rec)
            vals = {k: v for k, v in rec.items() if k not in keys}
            keys["store"] = args.store
            if not args.dry_run:
                upsert(con, table, keys, vals)
        counts[table] = len(records)

    put("hpb_blog_effects", lambda r: {"month": r["month"], "blog_title": r["blog_title"],
                                   "coupon_name": r.get("coupon_name")}, blogs)
    put("hpb_feature_stats", lambda r: {"month": r["month"], "feature_name": r["feature_name"]}, feats)
    put("hpb_feature_coupon_clicks", lambda r: {"month": r["month"],
                                            "feature_name": r["feature_name"],
                                            "coupon_name": r["coupon_name"]}, fcoups)
    put("hpb_style_stats", lambda r: {"month": r["month"], "style_name": r["style_name"],
                                  "listing_no": r.get("listing_no")}, styles)
    put("hpb_coupon_stats", lambda r: {"month": r["month"], "coupon_name": r["coupon_name"]}, coupons)
    put("hpb_stylist_stats", lambda r: {"month": r["month"], "stylist": r["stylist"]}, stylists)
    if not args.dry_run:
        con.commit()

    print(f"対象月号: {cur}（直近3月号: {', '.join(m3)}）")
    for t, n in counts.items():
        print(f"  {t}: {n}件")
    if blogs:
        print("\n  ブログ反響（抜粋）:")
        for b in blogs[-4:]:
            print(f"    {b['month']} [{b['clicks']}クリック] {b['blog_title'][:38]}")
    if feats:
        top = sorted([f for f in feats if f.get("view_rate")],
                     key=lambda f: -f["view_rate"])[:4]
        print("\n  特集 閲覧率上位（抜粋）:")
        for f in top:
            print(f"    {f['view_rate']}% {f['feature_name'][:30]} "
                  f"(自店クリック {f.get('own_clicks')})")
    empty = [t for t, n in counts.items() if n == 0]
    if empty:
        print(f"\n⚠ 抽出できなかったテーブル: {', '.join(empty)}")
        print("  → コンテンツ分析担当がPDFを直接読み、scripts/hpb/db_put.py で補完してください")


if __name__ == "__main__":
    main()
