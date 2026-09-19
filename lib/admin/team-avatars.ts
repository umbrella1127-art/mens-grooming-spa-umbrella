// 管理画面用の担当ポートレート（assets/team/）。公開サイトの public/ には置かない。
// 名簿の agent 名（agent_roster.agent）→ 画像。roster.py の担当を増やしたらここにも足す。
import img0 from "@/assets/team/hpb-analyst-funnel.jpg";
import img1 from "@/assets/team/hpb-analyst-market.jpg";
import img2 from "@/assets/team/hpb-analyst-retention.jpg";
import img3 from "@/assets/team/hpb-collector.jpg";
import img4 from "@/assets/team/hpb-content-analyst.jpg";
import img5 from "@/assets/team/hpb-orchestrator.jpg";
import img6 from "@/assets/team/hpb-page-scout.jpg";
import img7 from "@/assets/team/hpb-reporter.jpg";
import img8 from "@/assets/team/hpb-strategist.jpg";
import img9 from "@/assets/team/hpb-strategist-creative.jpg";
import img10 from "@/assets/team/hpb-strategist-ops.jpg";
import img11 from "@/assets/team/hpb-strategist-page.jpg";
import img12 from "@/assets/team/hpb-strategist-price.jpg";
import img13 from "@/assets/team/threads-blog-writer.jpg";
import img14 from "@/assets/team/threads-caretaker.jpg";
import img15 from "@/assets/team/threads-librarian.jpg";
import img16 from "@/assets/team/threads-orchestrator.jpg";
import img17 from "@/assets/team/threads-researcher.jpg";
import img18 from "@/assets/team/threads-strategist.jpg";

export const TEAM_AVATARS: Record<string, string> = {
  "hpb-analyst-funnel": img0.src,
  "hpb-analyst-market": img1.src,
  "hpb-analyst-retention": img2.src,
  "hpb-collector": img3.src,
  "hpb-content-analyst": img4.src,
  "hpb-orchestrator": img5.src,
  "hpb-page-scout": img6.src,
  "hpb-reporter": img7.src,
  "hpb-strategist": img8.src,
  "hpb-strategist-creative": img9.src,
  "hpb-strategist-ops": img10.src,
  "hpb-strategist-page": img11.src,
  "hpb-strategist-price": img12.src,
  "threads-blog-writer": img13.src,
  "threads-caretaker": img14.src,
  "threads-librarian": img15.src,
  "threads-orchestrator": img16.src,
  "threads-researcher": img17.src,
  "threads-strategist": img18.src,
};
