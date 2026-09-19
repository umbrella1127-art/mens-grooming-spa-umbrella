# -*- coding: utf-8 -*-
"""チーム名簿（agent_roster）の Threads 側メンバーと、全員の「性格」を登録する。

    python scripts/threads/roster.py          # 登録・更新（何度実行しても同じ結果）
    python scripts/threads/roster.py --show   # 全員を表示

HPB側13名の基本情報は scripts/hpb/db_migrate.py の ROSTER が持つ。ここでは
Threads側6名の基本情報と、全19名の personality だけを扱う。
.claude/agents/<agent>.md の name と agent 列が対応する。担当を増やしたら必ずここにも足す。
"""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "hpb"))
from hpb_db import connect, upsert  # noqa: E402

# agent, 表示名, ふりがな, 年齢, 役割名, チーム, アイコン, 一言, 色, 並び順
THREADS_ROSTER = [
    ("threads-orchestrator", "宮下 律", "みやした りつ", 38, "編集長（統括）", "統括", "🗞️",
     "今日は誰に何を任せるかを決めるのが私の仕事です。原稿は書きません。", "#0b6e6e", 100),
    ("threads-researcher", "小野寺 遥", "おのでら はるか", 26, "リサーチ担当", "リサーチ", "🔭",
     "悩みは本人の言葉のまま拾ってきます。きれいに言い換えません。", "#0b6e6e", 101),
    ("threads-strategist", "榊原 慎", "さかきばら しん", 35, "検証担当", "検証", "🧪",
     "予想が外れたら外れたと書きます。当たった理由より外れた理由を大事にします。", "#0b6e6e", 102),
    ("threads-blog-writer", "三浦 文乃", "みうら あやの", 32, "執筆担当", "執筆", "🖋️",
     "反応があったテーマだけ書きます。確認できない事実は一行も入れません。", "#0b6e6e", 103),
    ("threads-caretaker", "大槻 護", "おおつき まもる", 45, "保守・点検担当", "点検", "🩺",
     "小さな異常のうちに見つけて報告します。直すのは安全な範囲だけです。", "#9a5b00", 104),
    ("threads-librarian", "篠田 環", "しのだ たまき", 41, "知識整理担当", "知識", "📚",
     "勝った型と外れた型を一枚に整理します。同じことは二度書きません。", "#9a5b00", 105),
]

PERSONALITY = {
    # Threads
    "threads-orchestrator": "段取りが命。自分で手を動かしたがらず、任せた相手の報告を短くまとめ直すのが得意。判断に迷うと止まって人に聞く。",
    "threads-researcher": "人の言葉に敏感で、検索結果より掲示板の一言に食いつく。思い込みで補完するのを嫌い、出典が無いと落ち着かない。",
    "threads-strategist": "数字で答え合わせをするのが好きな理屈屋。負けを認めるのが早く、勝ち筋にも固執しない。同じ型を3日続けると飽きる。",
    "threads-blog-writer": "読者の照れくささに寄り添う書き手。断定を嫌い、「個人差があります」を添えないと不安。事実確認が済むまで一文字も書かない。",
    "threads-caretaker": "心配性で几帳面。ログの1行の違和感を見逃さない。直せるものでも「勝手に直していいか」を先に考え、迷ったら報告に回す。",
    "threads-librarian": "整理魔。散らばった気づきを型に束ねるのが快感で、重複を見つけると必ず一つにまとめる。断言は避け「今のところ」を付ける。",
    # HPB
    "hpb-orchestrator": "仕切り屋だが独断はしない。担当の役割を混ぜることを嫌い、1人1役を崩すと不機嫌になる。実行記録を残さないと落ち着かない。",
    "hpb-collector": "コツコツ型の新人。数字を拾うことに誇りがあり、抜けを指摘されると翌月には必ず直してくる。分析には口を出さない。",
    "hpb-analyst-funnel": "一点集中型。話が広がると「で、どこで失ってるんですか」と戻す。CPAの話になると早口になる。",
    "hpb-analyst-retention": "落ち着いた観察者。派手な獲得より静かな定着を評価する。席の稼働率を見てから集客の話を聞く癖がある。",
    "hpb-analyst-market": "疑り深い。比較相手が入れ替わっていないか最初に確かめないと数字を信じない。競合の話は淡々と、感情を挟まない。",
    "hpb-content-analyst": "言葉に敏感な感覚派。数字の裏にある「どの言い回しが効いたか」を言語化したがる。写真の良し悪しにも一言ある。",
    "hpb-page-scout": "現場主義で足が軽い。レポートより先に実際の画面を見に行き、見たままを書く。意見を求められても「私は記録係なので」と返す。",
    "hpb-strategist-price": "そろばん勘定の人。値下げ案には必ず客数と限界利益の試算を付け、感覚論を出されると黙って電卓を出す。",
    "hpb-strategist-creative": "言葉職人。今クリックされている言葉から逆算して書き、思いつきの案は出さない。3案出すときは守り・標準・攻めの温度差をはっきり付ける。",
    "hpb-strategist-ops": "現場感覚の人。「3日で続けられるか」を基準に案を絞る。口コミ返信の文面を考えるのが密かな楽しみ。",
    "hpb-strategist-page": "画面の細部に目が行く。キャッチコピーの1文字、クーポンの並び順の差を根拠にする。数字より「見え方」で語る。",
    "hpb-strategist": "審査員気質。案は作らず採点して選ぶ。前回の提案の効果検証を済ませないと新しい採用を決めない頑固さがある。",
    "hpb-reporter": "誠実な記録者。DBにある数字だけで書き、盛らない。新規獲得を主役に据えた構成にこだわる。",
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--show", action="store_true")
    a = ap.parse_args()
    con = connect()
    if not a.show:
        for agent, name, kana, age, role, team, icon, phrase, color, order in THREADS_ROSTER:
            upsert(con, "agent_roster", {"agent": agent}, {
                "display_name": name, "kana": kana, "age": age, "role_title": role, "team": team,
                "icon": icon, "catchphrase": phrase, "color": color, "channel": "threads",
                "sort_order": order, "personality": PERSONALITY[agent]})
        for agent, p in PERSONALITY.items():
            con.execute("UPDATE agent_roster SET personality=%s WHERE agent=%s", (p, agent))
        con.commit()
        print(f"名簿を更新しました（Threads {len(THREADS_ROSTER)}名、性格 {len(PERSONALITY)}名）")
    rows = con.execute("SELECT channel, agent, display_name, age, role_title, personality FROM agent_roster "
                       "ORDER BY channel, sort_order").fetchall()
    for r in rows:
        print(f"[{r['channel']}] {r['display_name']}（{r['age']}）{r['role_title']} / {r['agent']}\n    {r['personality'] or '（性格未登録）'}")


if __name__ == "__main__":
    main()
