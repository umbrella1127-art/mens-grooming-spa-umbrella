# -*- coding: utf-8 -*-
"""Threads投稿の判定ルール（T+1 / T+7 共通）。threads_api.py measure から使う。

比べる相手（ベースライン）: その投稿の日より前の7日間に出した投稿の、同じ日数後（T+1ならT+1）の平均。
  - 3本未満しか無ければ判定しない（insufficient）

判定（verdict）:
  win   … いいね・返信などの反応スコアが平均を上回った（平均が0なら1以上で勝ち）→ ブログ化の候補
  lead  … 反応は無いが、表示が平均の1.5倍以上
  lose  … 表示が平均の半分以下
  flat  … それ以外（平均並み）

予測の答え合わせ（prediction_hit）: 投稿前に書いた「predicted_metric が平均より above/same/below」と、
実際の向き（平均比 1.2倍以上=above、0.8倍以下=below、その間=same）を比べる。
  hit … 一致 ／ miss … 逆（上と予測して下、など）／ partial … 片方が same
"""
from datetime import timedelta

MIN_N = 3
LEAD = 1.5
LOSE = 0.5
UP = 1.2
DOWN = 0.8


def baseline(con, trial_date, days_after):
    start, end = trial_date - timedelta(days=7), trial_date - timedelta(days=1)
    r = con.execute(
        "SELECT COUNT(*) n, AVG(s.views) views, AVG(s.reaction_score) score "
        "FROM threads_trial_snapshots s JOIN threads_trials t ON t.id=s.trial_id "
        "WHERE s.days_after=%s AND t.trial_date BETWEEN %s AND %s",
        (days_after, start, end)).fetchone()
    return {"n": int(r["n"]), "views": float(r["views"] or 0), "reaction_score": float(r["score"] or 0),
            "from": start.isoformat(), "to": end.isoformat()}


def verdict(views, score, base):
    if base["n"] < MIN_N:
        return "insufficient"
    if score > 0 and score > base["reaction_score"]:
        return "win"
    if base["views"] > 0 and views >= base["views"] * LEAD:
        return "lead"
    if base["views"] > 0 and views <= base["views"] * LOSE:
        return "lose"
    return "flat"


def direction(actual, base_value):
    if base_value == 0:
        return "above" if actual > 0 else "same"
    ratio = actual / base_value
    if ratio >= UP:
        return "above"
    if ratio <= DOWN:
        return "below"
    return "same"


def prediction_hit(predicted_metric, predicted_vs_baseline, views, score, base):
    if not predicted_metric or not predicted_vs_baseline or base["n"] < MIN_N:
        return None
    if predicted_metric == "views":
        actual = direction(views, base["views"])
    else:
        actual = direction(score, base["reaction_score"])
    if actual == predicted_vs_baseline:
        return "hit"
    if {actual, predicted_vs_baseline} == {"above", "below"}:
        return "miss"
    return "partial"


VERDICT_LABEL = {"win": "反応あり", "lead": "表示が伸びた", "flat": "平均並み", "lose": "表示が落ちた",
                 "insufficient": "比べる投稿が足りない"}
HIT_LABEL = {"hit": "予測どおり", "partial": "一部当たり", "miss": "予測と逆"}
