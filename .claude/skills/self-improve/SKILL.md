---
name: self-improve
description: 自律改善（ループB「自分自身を直す」の修繕工程）の手順。仕組みの改善案を1〜2件選び、直したいファイルの新しい中身を scripts/improve/_work/ に書いて improve.py draft に渡す。auto-improver 専用。
user-invocable: false
---

# 自律改善の手順（auto-improver 専用・毎朝）

スライドS09「自分を直す。でも、安全に。」の **起草** を担当する。流れ:

```
観測（改善案・直近7日の記録）→ 起草（あなた）→ 安全ゲート（gate.py）→ 承認（オーナー）→ 反映（improve.py）→ 7日後に効果確認（悪化・変化なしは自動で元に戻す）
```

**今は全件オーナーの承認制**（`AUTO_APPLY=False`）。あなたが書いた案は、承認されるまで反映されない。

## 0. 最初に読む
1. `python scripts/reflect/reflect.py open --kind system`（未処理の仕組みの改善案。点検担当が reported にしたものを優先）
2. `python scripts/improve/improve.py status`（既に作った変更。同じ案をもう一度作らない）
3. `python scripts/threads/tdb.py --context` と `python scripts/threads/health.py --json`（直近の異常・実行記録）
4. `python scripts/threads/tdb.py --knowledge`（運用の決めごと・退役の理由）

## 1. 直す案を選ぶ（1日2件まで。0件でもよい）
選んでよいもの:
- 同じ提案が何度も出ている／点検担当が reported にした
- 直す場所がはっきりしている（ファイルと行が特定できる）
- 小さく直せる（1案1ファイルが基本。手順書なら30行以内）

選ばないもの（`reflect.py resolve --status rejected --by auto-improver --note "<理由>"` で理由を残してよい）:
- 公開サイト（`app/` `components/` `lib/`）、DB（`supabase/`）、秘密情報、`AGENTS.md`・`CLAUDE.md`
- 絶対ルール（`threads-blog-rules`・`check_article.py` の禁止表現）を **ゆるめる** もの
- 定期実行・許可ツール（`scripts/threads/schedule/`）、自律改善そのもの（`scripts/improve/`・この手順書・自分の定義）
- 本番投稿（`--live`）や承認の手順を増やす・省くもの
- 新しい機能を足すもの（それは人が決める）
- 事業の改善（投稿の中身・時刻）。それは ④事業の改善案 の担当

## 2. 新しい中身を書く
1. 直すファイルを `Read` で **全部** 読む
2. 直したあとの **ファイル全体** を `scripts/improve/_work/<改善案id>/<ファイル名>` に `Write` する
   - 直す所以外は1文字も変えない（改行・空白・見出しの順番も）
   - 手順書の先頭の設定（`---` で囲まれた部分）は必ず残す
   - 判定のしきい値（`scripts/threads/judge.py` の `MIN_N` `LEAD` `LOSE` `UP` `DOWN`）は、数字だけを変える
3. 何を直したかを1行で言えるか確かめる。言えないなら大きすぎる

## 3. 効果の測り方を決める（すべて「少ないほど良い」）
| 指標 | 使うとき | target の例 |
|---|---|---|
| `run_error_rate` | ある工程の失敗・一部のみを減らしたい | `threads:validate` |
| `issue_count` | ある種類の異常を減らしたい | `not_posted` / `unmeasured` / `run_error` |
| `rules_ng_rate` | ある担当の「ルール要確認」を減らしたい | `threads-strategist` |

7日後に反映前の7日と比べ、**良くなっていなければ自動で元に戻る**。直したい問題が一番まっすぐ表れる指標を選ぶ。

## 4. 下書きとして渡す
```
python scripts/improve/improve.py draft --proposal <改善案id> --summary "<何を直したか1行>" \
  --metric <指標> --target <対象> \
  --change <リポジトリ内のパス>=scripts/improve/_work/<改善案id>/<ファイル名>
```
- 結果の gate（auto / approval / forbidden）と理由をそのまま報告に書く
- forbidden で却下されたら、それ以上いじらない（人が判断する）
- 「1日に作れる変更は2件まで」と出たら、今日はそこで止める

## 振り返りを書く（完了報告の直前に必ず1回）
`.claude/skills/run-reflection/SKILL.md` の手順で、`--channel threads --agent auto-improver --run-ref threads:improve:<日本時間の日付>` として記録する。

## 5. 報告
作った変更（#番号・gate・対象ファイル・効果の測り方）、見送った案と理由。0件なら「直す案なし」と1行。
