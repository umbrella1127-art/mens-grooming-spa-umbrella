import { verifyKey } from "discord-interactions";
import { editDiscordMessage } from "@/lib/discord";
import { getServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

const STATUS_LABEL: Record<string, string> = {
  approved: "✅ 承認済み",
  rejected: "❌ 却下",
};

export async function POST(req: Request) {
  const signature = req.headers.get("x-signature-ed25519");
  const timestamp = req.headers.get("x-signature-timestamp");
  const rawBody = await req.text();

  const publicKey = process.env.DISCORD_PUBLIC_KEY!;
  const isValid =
    signature &&
    timestamp &&
    (await verifyKey(rawBody, signature, timestamp, publicKey));

  if (!isValid) {
    return new Response("invalid request signature", { status: 401 });
  }

  const body = JSON.parse(rawBody);

  // PING（Discord側の疎通確認）
  if (body.type === 1) {
    return Response.json({ type: 1 });
  }

  // ボタンクリック
  if (body.type === 3) {
    const customId: string = body.data.custom_id;
    const [action, draftId] = customId.split(":");
    const supabase = getServiceClient();

    if (action === "approve" || action === "reject") {
      const status = action === "approve" ? "approved" : "rejected";
      await supabase
        .from("content_drafts")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", draftId);

      const originalContent: string = body.message?.content ?? "";
      return Response.json({
        type: 7, // UPDATE_MESSAGE
        data: {
          content: `${STATUS_LABEL[status]}\n\n${originalContent}`,
          components: [],
        },
      });
    }

    if (action === "edit") {
      return Response.json({
        type: 9, // MODAL
        data: {
          custom_id: `edit_modal:${draftId}`,
          title: "修正内容を入力",
          components: [
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "edit_text",
                  style: 2,
                  label: "どう直してほしいか教えてください",
                  required: true,
                  max_length: 1000,
                },
              ],
            },
          ],
        },
      });
    }
  }

  // 修正モーダルの送信
  if (body.type === 5) {
    const customId: string = body.data.custom_id;
    const [, draftId] = customId.split(":");
    const editNote: string =
      body.data.components[0].components[0].value ?? "";
    const supabase = getServiceClient();

    const { data: draft } = await supabase
      .from("content_drafts")
      .select("discord_channel_id, discord_message_id, content_text")
      .eq("id", draftId)
      .single();

    await supabase
      .from("content_drafts")
      .update({
        status: "editing",
        edit_note: editNote,
        updated_at: new Date().toISOString(),
      })
      .eq("id", draftId);

    if (draft?.discord_channel_id && draft?.discord_message_id) {
      await editDiscordMessage(draft.discord_channel_id, draft.discord_message_id, {
        content: `✏️ 修正依頼あり：${editNote}\n\n${draft.content_text}`,
        components: [],
      });
    }

    return Response.json({
      type: 4,
      data: {
        content: "修正リクエストを受け付けました。反映して改めてお送りします。",
        flags: 64, // ephemeral（本人にだけ見える）
      },
    });
  }

  return new Response("unhandled interaction type", { status: 400 });
}
