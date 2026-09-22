# -*- coding: utf-8 -*-
"""自律改善の「触る人」。修繕担当（AI）が書いた新しい中身を、安全ゲートで仕分けて反映し、7日後に効果を確かめる。

  下書き（修繕担当が呼ぶ）:
    python scripts/improve/improve.py draft --proposal 12 --summary "反応0が続く日の手順を足す" \
      --metric run_error_rate --target threads:validate \
      --change .claude/skills/threads-validate/SKILL.md=scripts/improve/_work/12/SKILL.md
      → 差分を出し gate.py で auto / approval / forbidden に仕分け、auto-improve/<id> ブランチにコミットする
        auto は main に反映（fast-forward。ただし AUTO_APPLY=False の間は承認待ち）、
        approval は承認待ち（Discord・/admin/activity）、forbidden は却下
  毎日の仕上げ（定期実行が呼ぶ）:
    python scripts/improve/improve.py tick     # 承認済みを反映し、7日たったものの効果を確かめる（悪化・変化なしは元に戻す）
  見る:
    python scripts/improve/improve.py status
  人が決める（管理画面の代わりに）:
    python scripts/improve/improve.py decide --id 3 --approve | --reject --note "..."

作業フォルダ（あなたの編集中のファイル）は切り替えない。ブランチは git の低レベル操作で裏側に作り、
反映は `git merge --ff-only` で行う。対象ファイルが編集中（未コミットの変更あり）なら反映せず止まる。
効果の測り方（すべて少ないほど良い）:
  run_error_rate:<routine>  … その工程の失敗・一部のみの割合（agent_runs）
  issue_count:<kind>        … その種類の異常が1日あたり何件出たか（pipeline_issues）
  rules_ng_rate:<agent>     … その担当の振り返りで「ルール要確認」だった割合（run_reflections）
"""
import argparse
import difflib
import json
import os
import subprocess
import sys
import tempfile
from datetime import datetime, timedelta
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "hpb"))
sys.path.insert(0, str(HERE.parent / "threads"))
sys.path.insert(0, str(HERE))
from hpb_db import JST, PROJECT_ROOT, connect, env  # noqa: E402
from psycopg.types.json import Json  # noqa: E402
import gate as gatelib  # noqa: E402

# 安全ゲートが auto と判定した変更を、承認なしで反映するか。
# 2026-09-22 オーナーの判断で「最初は全件承認制、ある程度たったら全自動」。False の間は auto も承認待ちにする。
# ここ（scripts/improve/）は gate.py で forbidden なので、AI が自分で True にすることはできない
AUTO_APPLY = False
MAX_DRAFTS_PER_DAY = 2
WINDOW_DAYS = 7
MAX_EXTENSIONS = 2
MIN_OBS = 3
GIT_ENV = {"GIT_AUTHOR_NAME": "auto-improver", "GIT_AUTHOR_EMAIL": "auto-improver@localhost",
           "GIT_COMMITTER_NAME": "auto-improver", "GIT_COMMITTER_EMAIL": "auto-improver@localhost"}


# ---------- git（作業フォルダを切り替えない操作だけ） ----------

def git(*args, env_extra=None, check=True, input_text=None):
    e = {**os.environ, **(env_extra or {})}
    r = subprocess.run(["git", *args], cwd=PROJECT_ROOT, capture_output=True, text=True, encoding="utf-8",
                       env=e, input=input_text)
    if check and r.returncode != 0:
        raise RuntimeError(f"git {' '.join(args)}: {r.stderr.strip()}")
    return r.stdout.strip()


def head_blob(path, rev="HEAD"):
    r = subprocess.run(["git", "rev-parse", f"{rev}:{path}"], cwd=PROJECT_ROOT, capture_output=True, text=True)
    return r.stdout.strip() if r.returncode == 0 else None


def blob_text(sha):
    return git("cat-file", "-p", sha) if sha else None


def build_commit(parent, blobs, message):
    """parent の上に {path: blob_sha} を載せたコミットを作る（作業フォルダ・本来のindexは触らない）。"""
    with tempfile.TemporaryDirectory() as tmp:
        idx = {"GIT_INDEX_FILE": str(Path(tmp) / "index")}
        git("read-tree", parent, env_extra=idx)
        for path, sha in blobs.items():
            if sha:
                git("update-index", "--add", "--cacheinfo", f"100644,{sha},{path}", env_extra=idx)
            else:  # 変更前に無かったファイル（差し戻しで消す）
                git("update-index", "--force-remove", path, env_extra=idx)
        tree = git("write-tree", env_extra=idx)
    return git("commit-tree", tree, "-p", parent, "-F", "-", env_extra=GIT_ENV, input_text=message)


class DirtyError(RuntimeError):
    """対象ファイルが編集中。承認はそのまま残し、次の tick で反映し直す。"""


def fast_forward(branch, files):
    """main の作業フォルダへ反映する。対象が編集中なら止める。"""
    if git("rev-parse", "--abbrev-ref", "HEAD") != "main":
        raise RuntimeError("作業フォルダが main ではないため反映しません")
    dirty = git("status", "--porcelain", "--", *files)
    if dirty:
        raise DirtyError(f"対象ファイルが編集中のため反映を待っています: {dirty.splitlines()[0]}")
    git("merge", "--ff-only", branch)


# ---------- 効果の測り方 ----------

def measure(con, metric, target, start, end):
    if metric == "run_error_rate":
        r = con.execute("SELECT count(*) n, count(*) FILTER (WHERE status IN ('error','partial')) bad FROM agent_runs "
                        "WHERE routine=%s AND status<>'running' AND ran_at >= %s AND ran_at < %s",
                        (target, start, end)).fetchone()
        n, bad = r["n"], r["bad"]
        return {"obs": n, "value": (bad / n) if n else 0.0, "bad": bad}
    if metric == "issue_count":
        n = con.execute("SELECT count(*) n FROM pipeline_issues WHERE kind=%s AND detected_at >= %s AND detected_at < %s",
                        (target, start, end)).fetchone()["n"]
        days = max(1, (end - start).days)
        return {"obs": days, "value": n / days, "bad": n}
    if metric == "rules_ng_rate":
        r = con.execute("SELECT count(*) n, count(*) FILTER (WHERE NOT rules_ok) bad FROM run_reflections "
                        "WHERE agent=%s AND created_at >= %s AND created_at < %s", (target, start, end)).fetchone()
        n, bad = r["n"], r["bad"]
        return {"obs": n, "value": (bad / n) if n else 0.0, "bad": bad}
    raise ValueError(metric)


# ---------- 通知 ----------

def notify(text):
    try:
        from threads_notify import send
        send(text, "care")
    except Exception as err:  # 通知の失敗で反映・差し戻しを止めない
        print(f"⚠ Discord通知に失敗: {err}")


def admin_url():
    base = (env("NEXT_PUBLIC_SITE_URL") or "").rstrip("/")
    return f"{base}/admin/activity#improve" if base else ""


def resolve_proposal(con, pid, status, note):
    if pid:
        con.execute("UPDATE improvement_proposals SET status=%s, resolved_by='auto-improver', resolve_note=%s, "
                    "resolved_at=CASE WHEN %s IN ('applied','rejected') THEN now() ELSE resolved_at END WHERE id=%s",
                    (status, note, status, pid))


# ---------- 下書き ----------

def cmd_draft(a):
    con = connect()
    p = con.execute("SELECT id, kind, status, proposal FROM improvement_proposals WHERE id=%s", (a.proposal,)).fetchone()
    if not p or p["kind"] != "system":
        sys.exit("仕組みの改善案（kind=system）の id を指定してください")
    if p["status"] not in ("open", "reported", "accepted"):
        sys.exit(f"改善案 #{p['id']} は {p['status']} なので下書きしません")
    if con.execute("SELECT 1 FROM improvement_changes WHERE proposal_id=%s AND status NOT IN ('rejected','failed')",
                   (p["id"],)).fetchone():
        sys.exit(f"改善案 #{p['id']} には既に変更があります（improve.py status）")
    today = datetime.now(JST).date()
    n_today = con.execute("SELECT count(*) n FROM improvement_changes WHERE (created_at AT TIME ZONE 'Asia/Tokyo')::date=%s",
                          (today,)).fetchone()["n"]
    if n_today >= MAX_DRAFTS_PER_DAY:
        sys.exit(f"1日に作れる変更は{MAX_DRAFTS_PER_DAY}件までです（今日 {n_today}件）")

    changes, base_blobs, new_blobs, diff_parts = [], {}, {}, []
    for spec in a.change:
        if "=" not in spec:
            sys.exit(f"--change は <リポジトリ内のパス>=<新しい中身のファイル> の形: {spec}")
        path, work = spec.split("=", 1)
        path = path.replace("\\", "/")
        if path.startswith("./"):
            path = path[2:]
        work_path = (PROJECT_ROOT / work).resolve()
        if not work_path.is_file():
            sys.exit(f"新しい中身のファイルがありません: {work}")
        new = work_path.read_text(encoding="utf-8").replace("\r\n", "\n")
        old_sha = head_blob(path)
        old = blob_text(old_sha).replace("\r\n", "\n") if old_sha else None
        if path.endswith(".py"):
            try:
                compile(new, path, "exec")
            except SyntaxError as err:
                sys.exit(f"{path} の新しい中身に文法エラー: {err}")
        if old and old.startswith("---\n") and not new.startswith("---\n"):
            sys.exit(f"{path} の先頭の設定（--- で囲まれた部分）を消さないでください")
        changes.append((path, old, new))
        base_blobs[path] = old_sha
        new_blobs[path] = git("hash-object", "-w", f"--path={path}", str(work_path))
        diff_parts.append("\n".join(difflib.unified_diff(
            (old or "").splitlines(), new.splitlines(), f"a/{path}", f"b/{path}", lineterm="")))

    gate, reasons = gatelib.classify(changes)
    diff = "\n".join(diff_parts)
    if not diff.strip():
        sys.exit("変更がありません")
    files = [c[0] for c in changes]
    row = con.execute(
        "INSERT INTO improvement_changes (proposal_id, summary, files, diff, base_blobs, new_blobs, gate, gate_reasons, "
        "watch_metric, watch_target, created_by) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id",
        (p["id"], a.summary, files, diff[:20000], Json(base_blobs), Json(new_blobs), gate, reasons,
         a.metric, a.target, a.by)).fetchone()
    cid = row["id"]
    print(f"変更 #{cid}: gate={gate}")
    for r in reasons:
        print(f"  {r}")

    if gate == "forbidden":
        con.execute("UPDATE improvement_changes SET status='rejected', decided_by='gate', note=%s WHERE id=%s",
                    ("安全ゲートで禁止: " + " / ".join(reasons), cid))
        resolve_proposal(con, p["id"], "rejected", f"自律改善では直せない場所（変更 #{cid}）。人が判断する")
        con.commit()
        notify(f"🛑 自律改善 #{cid}「{a.summary}」は触ってはいけない場所を含むため却下しました\n" + "\n".join(reasons))
        return

    branch = f"auto-improve/{cid}"
    sha = build_commit("HEAD", new_blobs, f"自律改善 #{cid}: {a.summary}\n\n改善案 #{p['id']}: {p['proposal']}\n"
                                          f"gate: {gate}\n効果の測り方: {a.metric}:{a.target}\n")
    git("update-ref", f"refs/heads/{branch}", sha)
    con.execute("UPDATE improvement_changes SET branch=%s, commit_sha=%s WHERE id=%s", (branch, sha, cid))
    con.commit()

    if gate == "auto" and AUTO_APPLY:
        apply_change(con, cid)
    else:
        if gate == "auto":
            reasons = reasons + ["[承認制] 自動で反映してよい範囲だが、今は全件をオーナーの承認で反映する運用"]
            con.execute("UPDATE improvement_changes SET gate_reasons=%s WHERE id=%s", (reasons, cid))
        con.execute("UPDATE improvement_changes SET status='awaiting_approval' WHERE id=%s", (cid,))
        resolve_proposal(con, p["id"], "accepted", f"変更 #{cid} を作成（承認待ち）")
        con.commit()
        notify(f"🔧 自律改善 #{cid}「{a.summary}」は人の承認が必要です\n" + "\n".join(reasons)
               + f"\n対象: {', '.join(files)}\n管理画面の「稼働状況」で差分を見て、承認か却下を選んでください。{admin_url()}")


# ---------- 反映・効果確認・差し戻し ----------

def apply_change(con, cid):
    c = con.execute("SELECT * FROM improvement_changes WHERE id=%s", (cid,)).fetchone()
    files, base = c["files"], c["base_blobs"]
    try:
        # 下書きのあと main が進んでいても、対象ファイルが同じなら今の main の上に作り直す
        if any(head_blob(f) != base.get(f) for f in files):
            con.execute("UPDATE improvement_changes SET status='stale', note=%s WHERE id=%s",
                        ("下書きのあと対象ファイルが変わったため反映しませんでした。作り直しが必要です", cid))
            con.commit()
            notify(f"⚠️ 自律改善 #{cid}「{c['summary']}」は対象ファイルが先に変わっていたため反映しませんでした")
            return
        head = git("rev-parse", "HEAD")
        if git("rev-parse", f"{c['commit_sha']}^") != head:
            sha = build_commit(head, c["new_blobs"], git("log", "-1", "--format=%B", c["commit_sha"]))
            git("update-ref", f"refs/heads/{c['branch']}", sha)
            con.execute("UPDATE improvement_changes SET commit_sha=%s WHERE id=%s", (sha, cid))
        fast_forward(c["branch"], files)
    except DirtyError as err:
        # 承認済みのまま残し、編集が終わったあとの tick で反映する（通知は最初の1回だけ）
        first = c["note"] != str(err)
        con.execute("UPDATE improvement_changes SET note=%s WHERE id=%s", (str(err)[:500], cid))
        con.commit()
        if first:
            notify(f"⏸ 自律改善 #{cid}「{c['summary']}」は{err}（編集が終わったら自動で反映します）")
        return
    except RuntimeError as err:
        con.execute("UPDATE improvement_changes SET status='failed', note=%s WHERE id=%s", (str(err)[:500], cid))
        con.commit()
        notify(f"⚠️ 自律改善 #{cid}「{c['summary']}」を反映できませんでした: {err}")
        return

    now = datetime.now(JST)
    base_m = measure(con, c["watch_metric"], c["watch_target"], now - timedelta(days=WINDOW_DAYS), now)
    con.execute("UPDATE improvement_changes SET status='applied', applied_at=now(), verify_after=%s, baseline=%s "
                "WHERE id=%s", ((now + timedelta(days=WINDOW_DAYS)).date(), Json(base_m), cid))
    resolve_proposal(con, c["proposal_id"], "applied", f"変更 #{cid} を反映（{WINDOW_DAYS}日後に効果を確認）")
    con.commit()
    print(f"変更 #{cid} を反映しました（{c['branch']}）")
    notify(f"✅ 自律改善 #{cid}「{c['summary']}」を反映しました（{c['gate']}）\n"
           f"対象: {', '.join(files)}\n{WINDOW_DAYS}日後に「{c['watch_metric']}:{c['watch_target']}」で効果を確かめ、"
           f"良くなっていなければ自動で元に戻します")


def revert_change(con, c, reason):
    files = c["files"]
    try:
        if any(head_blob(f) != c["new_blobs"].get(f) for f in files):
            con.execute("UPDATE improvement_changes SET status='stale', note=%s WHERE id=%s",
                        (f"{reason}。ただし反映後に対象ファイルが変わっていたため自動では戻していません", c["id"]))
            con.commit()
            notify(f"⚠️ 自律改善 #{c['id']}「{c['summary']}」は{reason}。対象ファイルが後から変わっていたため、"
                   "自動では戻していません。手で確認してください")
            return
        restore = {f: c["base_blobs"].get(f) for f in files}
        branch = f"{c['branch']}-revert"
        sha = build_commit(git("rev-parse", "HEAD"), restore, f"自律改善 #{c['id']} を元に戻す: {c['summary']}\n\n{reason}\n")
        git("update-ref", f"refs/heads/{branch}", sha)
        fast_forward(branch, files)
    except DirtyError as err:
        # applied のまま残す（verify_after を過ぎているので、次の tick でもう一度戻しにいく）
        con.execute("UPDATE improvement_changes SET note=%s WHERE id=%s", (f"{reason}。{err}"[:500], c["id"]))
        con.commit()
        return
    except RuntimeError as err:
        con.execute("UPDATE improvement_changes SET status='failed', note=%s WHERE id=%s", (f"差し戻し失敗: {err}"[:500], c["id"]))
        con.commit()
        notify(f"⚠️ 自律改善 #{c['id']} を元に戻せませんでした: {err}")
        return
    con.execute("UPDATE improvement_changes SET status='reverted', revert_sha=%s, verified_at=now(), note=%s WHERE id=%s",
                (sha, reason, c["id"]))
    resolve_proposal(con, c["proposal_id"], "rejected", f"変更 #{c['id']} は{reason}ため元に戻した")
    con.commit()
    notify(f"↩️ 自律改善 #{c['id']}「{c['summary']}」は{reason}ため、元に戻しました")


def verify(con, c):
    applied = c["applied_at"]
    extensions = (c["result"] or {}).get("extensions", 0)
    end = applied + timedelta(days=WINDOW_DAYS * (1 + extensions))
    after = measure(con, c["watch_metric"], c["watch_target"], applied, end)
    before = c["baseline"] or {"value": 0, "obs": 0}
    if after["obs"] < MIN_OBS and extensions < MAX_EXTENSIONS:
        con.execute("UPDATE improvement_changes SET verify_after=%s, result=%s WHERE id=%s",
                    ((end + timedelta(days=WINDOW_DAYS)).date(), Json({**after, "extensions": extensions + 1}), c["id"]))
        con.commit()
        print(f"変更 #{c['id']}: 観測が少ない（{after['obs']}件）ので確認を{WINDOW_DAYS}日延長")
        return
    b, v = float(before["value"]), float(after["value"])
    con.execute("UPDATE improvement_changes SET result=%s WHERE id=%s", (Json({**after, "extensions": extensions}), c["id"]))
    label = f"{c['watch_metric']}:{c['watch_target']} 前{b:.2f}→後{v:.2f}"
    if v < b or (b == 0 and v == 0):
        note = f"{label}（{'良くなった' if v < b else '問題は出ていない'}）"
        con.execute("UPDATE improvement_changes SET status='kept', verified_at=now(), note=%s WHERE id=%s", (note, c["id"]))
        con.commit()
        notify(f"👍 自律改善 #{c['id']}「{c['summary']}」はこのまま残します: {note}")
    else:
        revert_change(con, c, f"効果が確認できなかった（{label}）")


def cmd_tick(_a):
    con = connect()
    for c in con.execute("SELECT id FROM improvement_changes WHERE status='approved' ORDER BY id").fetchall():
        apply_change(con, c["id"])
    today = datetime.now(JST).date()
    for c in con.execute("SELECT * FROM improvement_changes WHERE status='applied' AND verify_after <= %s ORDER BY id",
                         (today,)).fetchall():
        verify(con, c)
    print("tick 完了")


def cmd_decide(a):
    con = connect()
    if a.approve == a.reject:
        sys.exit("--approve か --reject のどちらかを指定してください")
    status = "approved" if a.approve else "rejected"
    cur = con.execute("UPDATE improvement_changes SET status=%s, decided_by='owner', note=%s "
                      "WHERE id=%s AND status='awaiting_approval'", (status, a.note, a.id))
    if a.reject:
        pid = con.execute("SELECT proposal_id FROM improvement_changes WHERE id=%s", (a.id,)).fetchone()
        if pid:
            resolve_proposal(con, pid["proposal_id"], "rejected", a.note or f"変更 #{a.id} をオーナーが却下")
    con.commit()
    print(f"OK {cur.rowcount}行（#{a.id} → {status}）。承認済みは次の tick で反映されます")


def cmd_status(_a):
    con = connect()
    rows = con.execute("SELECT id, status, gate, summary, files, verify_after, note FROM improvement_changes "
                       "ORDER BY id DESC LIMIT 20").fetchall()
    if not rows:
        print("(自律改善の変更はまだありません)")
    for r in rows:
        extra = f" 確認日 {r['verify_after']}" if r["status"] == "applied" else ""
        print(f"#{r['id']} [{r['status']}/{r['gate']}] {r['summary']}  ({', '.join(r['files'])}){extra}")
        if r["note"]:
            print(f"    {r['note'][:160]}")


def main():
    ap = argparse.ArgumentParser(description="自律改善の反映・効果確認")
    sub = ap.add_subparsers(dest="cmd", required=True)
    d = sub.add_parser("draft")
    d.add_argument("--proposal", type=int, required=True)
    d.add_argument("--summary", required=True)
    d.add_argument("--metric", required=True, choices=("run_error_rate", "issue_count", "rules_ng_rate"))
    d.add_argument("--target", required=True)
    d.add_argument("--change", action="append", required=True)
    d.add_argument("--by", default="auto-improver")
    d.set_defaults(func=cmd_draft)
    sub.add_parser("tick").set_defaults(func=cmd_tick)
    sub.add_parser("status").set_defaults(func=cmd_status)
    x = sub.add_parser("decide")
    x.add_argument("--id", type=int, required=True)
    x.add_argument("--approve", action="store_true")
    x.add_argument("--reject", action="store_true")
    x.add_argument("--note")
    x.set_defaults(func=cmd_decide)
    a = ap.parse_args()
    a.func(a)


if __name__ == "__main__":
    main()
